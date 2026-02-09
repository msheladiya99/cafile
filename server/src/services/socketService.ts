import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
    userId?: string;
    username?: string;
    role?: string;
}

interface UserStatus {
    userId: string;
    username: string;
    role: string;
    socketId: string;
    online: boolean;
    lastSeen: Date;
}

class SocketService {
    private io: SocketIOServer | null = null;
    private onlineUsers: Map<string, UserStatus> = new Map();

    initialize(httpServer: HTTPServer) {
        this.io = new SocketIOServer(httpServer, {
            cors: {
                origin: process.env.CLIENT_URL || 'http://localhost:5173',
                credentials: true
            }
        });

        this.io.use(this.authenticateSocket.bind(this));
        this.io.on('connection', this.handleConnection.bind(this));

        console.log('✅ Socket.io initialized');
    }

    private authenticateSocket(socket: AuthenticatedSocket, next: (err?: Error) => void) {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

            socket.userId = decoded.userId;
            socket.username = decoded.username;
            socket.role = decoded.role;

            next();
        } catch (error) {
            next(new Error('Authentication error: Invalid token'));
        }
    }

    private handleConnection(socket: AuthenticatedSocket) {
        const userId = socket.userId!;
        const username = socket.username!;
        const role = socket.role!;

        console.log(`🔌 User connected: ${username} (${userId})`);

        // Add user to online users
        this.onlineUsers.set(userId, {
            userId,
            username,
            role,
            socketId: socket.id,
            online: true,
            lastSeen: new Date()
        });

        // Broadcast online status to all clients
        this.broadcastOnlineUsers();

        // Join user's personal room for targeted system notifications
        socket.join(`user:${userId}`);

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`🔌 User disconnected: ${username} (${userId})`);

            const userStatus = this.onlineUsers.get(userId);
            if (userStatus) {
                userStatus.online = false;
                userStatus.lastSeen = new Date();
                this.onlineUsers.set(userId, userStatus);
            }

            // Broadcast updated online status
            this.broadcastOnlineUsers();
        });
    }

    // Broadcast online users to all connected clients
    private broadcastOnlineUsers() {
        if (this.io) {
            const onlineUsersList = Array.from(this.onlineUsers.values()).map(user => ({
                userId: user.userId,
                username: user.username,
                role: user.role,
                online: user.online,
                lastSeen: user.lastSeen
            }));

            this.io.emit('users:online', onlineUsersList);
        }
    }

    // Get online status for a specific user
    getUserStatus(userId: string): UserStatus | undefined {
        return this.onlineUsers.get(userId);
    }

    // Get all online users
    getOnlineUsers(): UserStatus[] {
        return Array.from(this.onlineUsers.values()).filter(user => user.online);
    }

    // Helper to send system-wide or targeted notifications (future use)
    emitToUser(userId: string, event: string, data: any) {
        if (this.io) {
            this.io.to(`user:${userId}`).emit(event, data);
        }
    }
}

export const socketService = new SocketService();
