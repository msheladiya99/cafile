# 🔑 Client Credentials Management Guide

## New Features Added!

You can now view and reset client credentials from the Clients page.

---

## How to View Client Credentials

1. Go to **Clients** page
2. Find the client in the table
3. Click the **🔑 Key icon** button in the Actions column
4. A dialog will open showing:
   - **Username** - The client's login username
   - **Note** - Information that password is encrypted and cannot be retrieved

### Copy Credentials
- Click the **copy icon** next to the username to copy it to clipboard
- Share the username with your client

---

## How to Reset Client Password

### When to Reset Password?
- Client forgot their password
- You need to share new credentials
- Security reasons

### Steps:
1. Go to **Clients** page
2. Find the client in the table
3. Click the **🔄 Reset icon** button in the Actions column
4. Confirm the action (old password will stop working!)
5. A dialog will open showing:
   - **Username** - The client's login username
   - **New Password** - The newly generated password
   - **Warning** - Save this password! It cannot be retrieved later.

### Copy New Credentials
- Click the **copy icon** next to the username to copy it
- Click the **copy icon** next to the password to copy it
- Share both with your client immediately

---

## Important Notes

⚠️ **Passwords are Encrypted**
- Passwords are hashed in the database for security
- Once created, passwords cannot be retrieved
- You can only generate a NEW password by resetting

⚠️ **Reset Password Warning**
- When you reset a password, the old password stops working immediately
- The client will need to use the new password to login
- Make sure to share the new credentials with the client

✅ **Best Practices**
1. Always copy credentials immediately after creation/reset
2. Share credentials securely with the client (email, WhatsApp, etc.)
3. Advise clients to change their password after first login (future feature)
4. Keep a secure record of which clients have been given credentials

---

## UI Elements

### Clients Table - Actions Column

Each client row now has two buttons:

| Icon | Color | Action | Description |
|------|-------|--------|-------------|
| 🔑 | Blue | View Credentials | Shows username only |
| 🔄 | Orange | Reset Password | Generates new password |

---

## Example Workflow

### Scenario 1: Client Forgot Password

1. Client calls: "I forgot my password"
2. You go to Clients page
3. Click 🔄 Reset Password for that client
4. Copy the new username and password
5. Share with client via phone/email
6. Client can now login with new credentials

### Scenario 2: Need to Check Username

1. You need to tell client their username
2. Go to Clients page
3. Click 🔑 View Credentials
4. Copy the username
5. Share with client

### Scenario 3: New Client Onboarding

1. Create new client (credentials shown once)
2. If you didn't save them, no problem!
3. Click 🔄 Reset Password
4. Get new credentials
5. Share with client

---

## Technical Details

### Backend API Endpoints

**Get Credentials:**
```
GET /api/admin/clients/:clientId/credentials
Response: { username, note }
```

**Reset Password:**
```
POST /api/admin/clients/:clientId/reset-password
Response: { username, password, message }
```

### Security

- ✅ Only admins can view/reset credentials
- ✅ Passwords are hashed with bcrypt
- ✅ New passwords are randomly generated (10 characters)
- ✅ Old password is immediately invalidated on reset

---

## Future Enhancements

Possible features to add:
- [ ] Client can change their own password
- [ ] Password strength requirements
- [ ] Password expiry/rotation policy
- [ ] Email notification when password is reset
- [ ] Activity log of password resets
- [ ] Two-factor authentication

---

**Your CA Office Portal now has complete credential management! 🎉**
