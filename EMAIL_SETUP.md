# 📧 Email Notifications Setup Guide

## ✅ Feature Complete!

Your CA Office Portal now has **automatic email notifications**!

---

## 🎯 What Gets Emailed

### 1. **Welcome Email** (When Client is Created)
- ✅ Sent automatically when admin creates a new client
- ✅ Contains login credentials (username & password)
- ✅ Beautiful branded HTML email
- ✅ Direct link to portal

### 2. **File Upload Notification** (When File is Uploaded)
- ✅ Sent automatically when admin uploads a file
- ✅ Shows file name, category, and year
- ✅ Direct link to download
- ✅ Professional design

---

## 🔧 Setup Instructions

### Step 1: Get Gmail App Password

1. **Go to Google Account Settings**
   - Visit: https://myaccount.google.com/apppasswords
   - Sign in with your Gmail account

2. **Create App Password**
   - Select app: **Mail**
   - Select device: **Other (Custom name)**
   - Name it: **CA Office Portal**
   - Click **Generate**

3. **Copy the 16-character password**
   - It will look like: `abcd efgh ijkl mnop`
   - Remove spaces: `abcdefghijklmnop`

### Step 2: Update .env File

Open `server/.env` and add:

```bash
# Your Gmail address
EMAIL_USER=your.email@gmail.com

# Your Gmail App Password (16 characters, no spaces)
EMAIL_PASSWORD=abcdefghijklmnop

# Name that appears in "From" field
EMAIL_FROM_NAME=CA Office Portal
```

### Step 3: Restart Server

```bash
# Stop the server (Ctrl+C)
# Start it again
npm run dev
```

---

## 📧 Email Templates

### Welcome Email Preview

```
Subject: Welcome to CA Office Portal - Your Login Credentials

Dear [Client Name],

Your account has been created successfully! You can now access your 
documents anytime through our secure portal.

🔐 Your Login Credentials
Username: clientname1234
Password: AbCdEfGhIj

⚠️ Important: Please save these credentials securely.

[Login Now Button]

What you can do:
✅ View all your uploaded documents
✅ Download ITR, GST, and Accounting files
✅ Filter by year and category
✅ Access 24/7 from anywhere
```

### File Upload Email Preview

```
Subject: New Document Available - ITR FY 2024

Dear [Client Name],

A new document has been uploaded to your CA Office Portal account.

📋 Document Details
File Name: ITR_Return_2024.pdf
Category: ITR
Financial Year: FY 2024-25

[Login to Portal Button]

Note: Please use your username and password to access the portal.
```

---

## 🎨 Email Design Features

- ✅ **Beautiful HTML Design** - Professional gradient header
- ✅ **Responsive** - Looks great on mobile and desktop
- ✅ **Branded** - Purple gradient matching your portal
- ✅ **Clear CTA** - Prominent "Login" button
- ✅ **Informative** - All important details included

---

## 🔒 Security Features

- ✅ **App Password** - Not your regular Gmail password
- ✅ **Secure Connection** - Uses Gmail's secure SMTP
- ✅ **No Reply** - Automated emails, no replies needed
- ✅ **One-time Credentials** - Password shown only once

---

## ⚙️ How It Works

### When You Create a Client:
1. Admin fills client form
2. System creates client account
3. Generates username & password
4. **Sends welcome email automatically** 📧
5. Shows credentials in dialog

### When You Upload a File:
1. Admin uploads file
2. System saves file
3. **Sends notification email automatically** 📧
4. Client receives instant notification

---

## 🧪 Testing Email

### Test Welcome Email:
1. Set up email in `.env`
2. Restart server
3. Create a new test client
4. Check the client's email inbox
5. You should receive welcome email!

### Test File Upload Email:
1. Upload a file for any client
2. Check the client's email inbox
3. You should receive upload notification!

---

## 🚫 Disabling Email (Optional)

If you don't want to use email notifications:

1. Leave `EMAIL_USER` and `EMAIL_PASSWORD` blank in `.env`
2. The app will work normally, just without emails
3. You'll see a console message: "Email not configured"

---

## 🐛 Troubleshooting

### Email Not Sending?

**Check 1: App Password**
- ❌ Don't use your regular Gmail password
- ✅ Use the 16-character app password
- ✅ Remove all spaces from the password

**Check 2: Gmail Settings**
- ✅ 2-Factor Authentication must be enabled
- ✅ App Passwords must be enabled
- ✅ Less Secure Apps should be OFF (use app password instead)

**Check 3: .env File**
- ✅ No quotes around values
- ✅ No spaces in password
- ✅ Correct email format

**Check 4: Server Restart**
- ✅ Restart server after changing `.env`
- ✅ Check console for "Email sent successfully" message

### Common Errors:

**Error: "Invalid login"**
- Solution: Use app password, not regular password

**Error: "Username and Password not accepted"**
- Solution: Enable 2FA and create app password

**Error: "Email not configured"**
- Solution: Fill in EMAIL_USER and EMAIL_PASSWORD in `.env`

---

## 📊 Email Logs

Check your server console for email status:

```
✅ Email sent successfully to client@example.com
✅ Welcome email sent successfully to client@example.com
❌ Failed to send email: [error details]
⚠️ Email notification skipped (not configured)
```

---

## 🎯 Best Practices

### For Production:

1. **Use Professional Email**
   - Use your business email (e.g., ca@yourfirm.com)
   - Or create dedicated email (e.g., portal@yourfirm.com)

2. **Customize Email Name**
   - Update `EMAIL_FROM_NAME` to your firm name
   - Example: "ABC & Associates CA Firm"

3. **Test Before Launch**
   - Send test emails to yourself
   - Check spam folder
   - Verify links work

4. **Monitor Delivery**
   - Check server logs
   - Ask clients if they received emails
   - Keep app password secure

---

## 🔄 Alternative Email Services

Currently using **Gmail**. You can also use:

### SendGrid (Recommended for Production)
- Free tier: 100 emails/day
- Better deliverability
- Detailed analytics

### Outlook/Office 365
- Change service to 'outlook'
- Use your Office 365 credentials

### Custom SMTP
- Use your hosting provider's SMTP
- Configure host, port, and credentials

---

## 📈 Email Statistics

Track in your Gmail:
- Sent emails
- Delivery rate
- Bounce rate

---

## 🎊 You're All Set!

Email notifications are now **fully integrated** into your CA Office Portal!

### What Happens Now:

1. ✅ Create a client → They get welcome email
2. ✅ Upload a file → They get notification
3. ✅ Professional communication
4. ✅ Happy clients!

---

## 📞 Need Help?

If emails aren't working:
1. Check the troubleshooting section above
2. Verify your app password
3. Check server console logs
4. Test with a different email address

---

**Enjoy automated email notifications! 📧🎉**
