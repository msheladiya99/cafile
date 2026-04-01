import mongoose, { Connection, Schema } from 'mongoose';
import { decrypt } from '../utils/encryption';

// ───────────────────────────────────────────────────────────────────────────────
// Connection cache — per subdomain
// ───────────────────────────────────────────────────────────────────────────────
const connectionCache = new Map<string, Connection>();

/**
 * Build a clean MongoDB URI pointing to `dbName`.
 *
 * Handles both:
 *  - mongodb://host/dbname?options
 *  - mongodb+srv://user:pass@cluster.mongodb.net/dbname?options
 */
function buildUriWithDb(baseUri: string, dbName: string): string {
    const queryIndex = baseUri.indexOf('?');
    const query = queryIndex !== -1 ? baseUri.slice(queryIndex) : '';
    const withoutQuery = queryIndex !== -1 ? baseUri.slice(0, queryIndex) : baseUri;

    const schemeEnd = withoutQuery.indexOf('://') + 3;
    const afterScheme = withoutQuery.slice(schemeEnd);
    const firstSlash = afterScheme.indexOf('/');

    let base: string;
    if (firstSlash === -1) {
        base = withoutQuery;
    } else {
        base = withoutQuery.slice(0, schemeEnd + firstSlash);
    }

    return `${base}/${dbName}${query}`;
}

// ───────────────────────────────────────────────────────────────────────────────
// RAW User Schema — does NOT have the global tenantPlugin applied.
// The plugin uses AsyncLocalStorage firmId context which is NOT available
// in the super-admin route context. For personal DB tenants, the database
// itself provides isolation — no firmId-based row filtering needed.
// ───────────────────────────────────────────────────────────────────────────────
export const rawUserSchema = new Schema(
    {
        username:     { type: String, required: true, trim: true },
        passwordHash: { type: String, required: true },
        role: {
            type: String,
            enum: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF', 'INTERN', 'CLIENT'],
            required: true,
        },
        firmId:   { type: Schema.Types.ObjectId, ref: 'Firm', default: null },
        clientId: { type: Schema.Types.ObjectId, ref: 'Client', default: null },
        lastLogin:   { type: Date, default: null },
        permissions: { type: [String], default: [] },
        name:        { type: String, trim: true },
        email:       { type: String, trim: true, lowercase: true },
        phone:       { type: String, trim: true },
        status:      { type: Boolean, default: true },
        firstName:   { type: String, trim: true },
        lastName:    { type: String, trim: true },
        employeeCode:{ type: String, trim: true },
        address:     { type: String, trim: true },
        country:     { type: String, trim: true },
        state:       { type: String, trim: true },
        city:        { type: String, trim: true },
        postalCode:  { type: String, trim: true },
        mobileNumber:{ type: String, trim: true },
        birthDate:   { type: String, trim: true },
        designation: { type: String, trim: true },
        joiningDate: { type: String, trim: true },
        monthlySalary:{ type: String, trim: true },
        ratePerHours: { type: String, trim: true },
        leavingDate:  { type: String, trim: true },
        reference:    { type: String, trim: true },
        description:  { type: String, trim: true },
        emergencyFirstName:    { type: String, trim: true },
        emergencyLastName:     { type: String, trim: true },
        emergencyRelationship: { type: String, trim: true },
        emergencyPhone:        { type: String, trim: true },
        field1: String, field2: String, field3: String, field4: String,
        field5: String, field6: String, field7: String,
        pfNumber:    String, esiNumber: String, aadharNumber: String,
        drivingLicenceNo: String,
        passport: Boolean, passportNo: String, passportAuthority: String,
        passportDateFrom: String, passportDateTo: String,
        visa: Boolean, visaNo: String, visaAuthority: String,
        visaDateFrom: String, visaDateTo: String,
        eid: Boolean, eidNo: String, eidAuthority: String,
        eidDateFrom: String, eidDateTo: String,
        bankName: String, bankBranch: String, accountNo: String,
        accountHolderName: String, ifscCode: String, bankAddress: String,
        profileImageUrl: String,
        documents: [{
            documentType: String, date: String, documentFormat: String,
            fileLocation: String, fileLabel: String, description: String,
            returnable: Boolean, fileName: String,
            driveFileId: String, driveWebViewLink: String,
        }],
    },
    { timestamps: true }
);

// Simple index without the plugin-based firmId scoping
rawUserSchema.index({ username: 1 }, { unique: true });

// ───────────────────────────────────────────────────────────────────────────────
// Get or create a tenant DB connection
// ───────────────────────────────────────────────────────────────────────────────
export const getTenantConnection = async (firm: {
    subdomain: string;
    dbType?: string;
    mongoUri?: string;
    dbName?: string;
}): Promise<Connection> => {
    const subdomain = firm.subdomain;
    const dbName = firm.dbName || `${subdomain}_db`;

    // ── 1. Return cached connection if alive ──────────────────────────────────
    const cached = connectionCache.get(subdomain);
    if (cached) {
        if (cached.readyState === 1) {
            console.log(`♻️  [dbManager] Reusing cached connection for "${subdomain}"`);
            return cached;
        }
        // Dead — remove and reconnect
        connectionCache.delete(subdomain);
        try { await cached.close(); } catch (_) { /* ignore */ }
    }

    // ── 2. Validate & resolve URI ──────────────────────────────────────────────
    if (!firm.mongoUri) {
        throw new Error(`mongoUri is missing for personal DB tenant "${subdomain}"`);
    }

    let rawUri: string;
    try {
        rawUri = decrypt(firm.mongoUri);
    } catch (e: any) {
        throw new Error(`Failed to decrypt mongoUri for "${subdomain}": ${e.message}`);
    }

    if (!rawUri.startsWith('mongodb://') && !rawUri.startsWith('mongodb+srv://')) {
        throw new Error(`Invalid MongoDB URI scheme for "${subdomain}". Must start with mongodb:// or mongodb+srv://`);
    }

    const uri = buildUriWithDb(rawUri, dbName);

    // Append SSL params if the URI doesn't already have them
    // This fixes ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR on MongoDB Atlas
    let finalUri = uri;
    if (!finalUri.includes('tlsAllowInvalidCertificates') && !finalUri.includes('ssl=false')) {
        finalUri += finalUri.includes('?') ? '&tlsAllowInvalidCertificates=true' : '?tlsAllowInvalidCertificates=true';
    }

    console.log(`🔌 [dbManager] Connecting "${subdomain}" → DB: "${dbName}"`);
    console.log(`🔌 [dbManager] URI scheme: ${rawUri.split('://')[0]}://***`);

    // ── 3. Create connection ──────────────────────────────────────────────────
    const connection = mongoose.createConnection(finalUri, {
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 15000,
        tls: true,
        tlsAllowInvalidCertificates: true,
    });

    // Wait for open / error
    await new Promise<void>((resolve, reject) => {
        connection.once('open', () => {
            console.log(`✅ [dbManager] Connected — "${subdomain}" → "${dbName}"`);
            resolve();
        });
        connection.once('error', (err: Error) => {
            console.error(`❌ [dbManager] Connection failed for "${subdomain}":`, err.message);
            reject(err);
        });
    });

    // Persist in cache
    connectionCache.set(subdomain, connection);
    return connection;
};

// ───────────────────────────────────────────────────────────────────────────────
// Get a model safely from a connection (avoids "Cannot overwrite model" error)
// ───────────────────────────────────────────────────────────────────────────────
export const getModelFromConnection = <T>(
    conn: Connection,
    modelName: string,
    schema: Schema<T>
) => {
    if (conn.modelNames().includes(modelName)) {
        return conn.model<T>(modelName);
    }
    return conn.model<T>(modelName, schema);
};

// ───────────────────────────────────────────────────────────────────────────────
// Get a model from the request context (Personal DB support)
// ───────────────────────────────────────────────────────────────────────────────
/**
 * Resolves the correct model based on whether the request is for a personal DB
 * or the default multi-tenant DB.
 * 
 * @param req The Express Request object (should have .db if personal)
 * @param modelName The string name of the model (e.g. 'User')
 * @param defaultModel The model imported from @/models
 * @param alternativeSchema Optional schema to use for the tenant connection (useful for avoiding plugins)
 */
export const getTenantModel = (
    req: any,
    modelName: string,
    defaultModel: any,
    alternativeSchema?: Schema
) => {
    if (req.db) {
        return getModelFromConnection(req.db, modelName, alternativeSchema || defaultModel.schema);
    }
    return defaultModel;
};


// ───────────────────────────────────────────────────────────────────────────────
// Graceful shutdown — close all tenant connections
// ───────────────────────────────────────────────────────────────────────────────
export const closeAllTenantConnections = async () => {
    const closePromises: Promise<void>[] = [];
    for (const [subdomain, conn] of connectionCache.entries()) {
        closePromises.push(
            conn.close().then(() => {
                connectionCache.delete(subdomain);
                console.log(`🔌 [dbManager] Closed connection for "${subdomain}"`);
            }).catch((e) => {
                console.warn(`[dbManager] Failed to close "${subdomain}":`, e.message);
            })
        );
    }
    await Promise.all(closePromises);
};
