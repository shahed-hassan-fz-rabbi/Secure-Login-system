# 🔐 Multi-Layer Secure Authentication System

A modern full-stack authentication system built with **Next.js**, **TypeScript**, **Tailwind CSS**, and **MongoDB Atlas**. The system implements multiple layers of authentication and security mechanisms to protect user accounts against common threats such as brute-force attacks, automated bot submissions, credential theft, and unauthorized access.

---

## 🚀 Live Demo & Repository

- **Live Deployment:** https://secure-login-system-gold-six.vercel.app
- **GitHub Repository:** https://github.com/shahed-hassan-fz-rabbi/Secure-Login-system

---

## 🌟 Key Features & Security Architecture

### 🔐 1. Multi-Layer Security

The application uses multiple security mechanisms instead of relying on a single authentication layer.

#### HTTP-Only Secure JWT Cookies

Authentication tokens are stored in cookies configured with:

- `httpOnly` – Prevents client-side JavaScript from accessing the token
- `secure` – Transmits only over HTTPS in production
- `sameSite: "lax"` – Reduces CSRF risk (though not a complete elimination)

**Important:** These measures significantly reduce—but do not completely eliminate—XSS and CSRF risks. They work best as part of a defense-in-depth strategy.

#### 🔑 Bcrypt Password Hashing

User passwords are **hashed** (not encrypted) using **bcrypt** with salted hashing before storage in MongoDB.

Key points:

- Passwords are never stored as plain text
- Bcrypt generates unique salts for each password
- The same password will produce different hashes on each invocation
- Hashes are computationally expensive to reverse (protects against brute-force)

```
User Password
      ↓
Bcrypt Hashing (with salt)
      ↓
Salted Password Hash
      ↓
MongoDB (One-way)
```

#### 🤖 Google reCAPTCHA v2

Google reCAPTCHA v2 is integrated into the authentication flow to help prevent automated bot submissions and credential-stuffing attempts.

#### 🚦 Rate Limiting

IP-based rate limiting is implemented on authentication endpoints to reduce repeated login attempts and help protect against brute-force attacks.

---

## 🔐 2. Two-Factor Authentication

The system supports **Two-Factor Authentication (2FA)** using **TOTP (Time-based One-Time Password)**.

Users can:

1. Generate a 2FA secret
2. Scan a QR code using Google Authenticator, Authy, or Microsoft Authenticator
3. Generate a time-based 6-digit OTP
4. Verify the OTP
5. Activate 2FA for their account

**Authentication Flow with 2FA:**

```
Password Authentication
       ↓
First Authentication Successful
       ↓
2FA Challenge Sent
       ↓
TOTP Verification
       ↓
Second Authentication Successful
       ↓
Authenticated User
```

This provides an additional authentication layer even if the user's password is compromised.

---

## 🔑 3. Authentication & Account Recovery

### Email & Password Authentication

Users can securely register and log in using their email address and password.

### Google OAuth 2.0

The application supports Google Sign-In using OAuth 2.0, allowing users to authenticate using their Google account.

### Email Verification

New accounts can be verified using email-based verification links. The link contains a token that expires after a set period.

### Secure Password Reset

Password reset functionality uses expiring reset tokens:

- Users request a password reset
- A secure token is generated and hashed before storage
- An email with a reset link (containing the token) is sent to the user
- The token is validated and checked for expiration
- The user can set a new password

### Session Management

The logout endpoint invalidates the authentication session/cookie and redirects the user to the login page.

---

## 🛡️ 4. Route Protection

Protected routes are secured using Next.js middleware and authentication checks.

**Access Control Flow:**

```
User Request
      ↓
Protected Route
      ↓
Middleware Check
      ├─ Valid JWT Token
      │  └─ Allow Access ✓
      │
      └─ No/Invalid Token
         └─ Redirect to Login ✗
```

Unauthenticated users attempting to access protected pages are automatically redirected to the login page.



### 📱 5. Multi-Device Session Management & Device Limiting
* **Centralized Session Tracking:** Dedicated `Session` collection mapping active user devices, IP addresses, and User-Agents.
* **Concurrent Device Limit:** Enforces a strict limit (e.g., maximum 2 concurrent active sessions) across standard login, 2FA, and Google OAuth flows.
* **Granular Session Revocation:** Allows remote device session invalidation directly from the database or dashboard.
---

## 🛠️ Tech Stack

| Domain            | Technology                  |
| ----------------- | --------------------------- |
| Frontend Framework| Next.js 14+                 |
| Language          | TypeScript                  |
| Styling           | Tailwind CSS                |
| Icons             | Lucide React                |
| Database          | MongoDB Atlas               |
| ODM               | Mongoose                    |
| Authentication    | JWT (JSON Web Tokens)       |
| Password Security | Bcrypt.js                   |
| 2FA               | TOTP / Google Authenticator |
| QR Generation     | QRCode.js                   |
| Bot Protection    | Google reCAPTCHA v2         |
| Email Service     | Nodemailer / Gmail SMTP     |
| Notifications     | Sonner Toast               |
| Deployment        | Vercel                      |
| Session Tracking  | MongoDB Session Collection with Dynamic UUIDs |
---

## 📁 Project Structure

```
secure-login-system/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── auth/
│   │   │       ├── 2fa/
│   │   │       │   ├── login-challenge/
│   │   │       │   │   └── route.ts
│   │   │       │   ├── setup/
│   │   │       │   │   └── route.ts
│   │   │       │   └── verify/
│   │   │       │       └── route.ts
│   │   │       │
│   │   │       ├── forgot-password/
│   │   │       │   └── route.ts
│   │   │       │
│   │   │       ├── google/
│   │   │       │   ├── callback/
│   │   │       │   │   └── route.ts
│   │   │       │   └── route.ts
│   │   │       │
│   │   │       ├── login/
│   │   │       │   └── route.ts
│   │   │       │
│   │   │       ├── logout/
│   │   │       │   └── route.ts
│   │   │       │
│   │   │       ├── me/
│   │   │       │   └── route.ts
│   │   │       │
│   │   │       ├── register/
│   │   │       │   └── route.ts
│   │   │       │
│   │   │       ├── reset-password/
│   │   │       │   └── route.ts
│   │   │       │
│   │   │       └── verify-email/
│   │   │           └── route.ts
│   │   │
│   │   ├── (protected)/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── page.tsx
│   │   └── layout.tsx
│   │
│   ├── lib/
│   │   ├── mongodb.ts
│   │   ├── rateLimit.ts
│   │   └── recaptcha.ts
│   │
│   ├── models/
│   │   └── User.ts
│   │   └── Session.ts
│   │   
│   │
│   └── middleware.ts
│
├── .env.example
├── next.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## ⚙️ Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/shahed-hassan-fz-rabbi/Secure-Login-system.git
cd Secure-Login-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# MongoDB Connection String
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_min_32_chars

# Google reCAPTCHA v2
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Gmail SMTP (for email verification & password reset)
EMAIL_SERVER_USER=your_email@gmail.com
EMAIL_SERVER_PASSWORD=your_16_digit_app_password
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: For production
NODE_ENV=development
```

**Important Security Notes:**

- Never commit `.env.local` to version control
- Add `.env.local` to `.gitignore`
- Use strong, random values for `JWT_SECRET` (minimum 32 characters)
- For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833), not your regular password
- Rotate secrets regularly in production

### 4. Run Development Server

```bash
npm run dev
```

Open your browser and navigate to:

```
http://localhost:3000
```

### 5. Build for Production

```bash
npm run build
npm start
```

---

## 🛡️ Security Best Practices Implemented

### 1. Password Protection

✓ Passwords are never stored as plain text  
✓ Bcrypt with salted hashing is applied  
✓ Passwords are excluded from public API responses  
✓ Password fields are never logged or exposed  

### 2. Session Security

✓ JWT tokens are stored in HTTP-only cookies  
✓ Secure cookie configuration for production  
✓ SameSite cookie policy reduces CSRF risk  
✓ Short token expiration times  

### 3. Bot Protection

✓ Google reCAPTCHA v2 on login/register forms  
✓ Reduces automated account takeover attempts  

### 4. Brute-Force Protection

✓ IP-based rate limiting on auth endpoints  
✓ Limits login attempts per IP address  
✓ Exponential backoff on repeated failures  

### 5. Two-Factor Authentication

✓ TOTP-based 2FA with time-based codes  
✓ Compatible with Google Authenticator, Authy, Microsoft Authenticator  
✓ Backup recovery codes for account recovery  
✓ Protects against password compromise  

### 6. Input Validation & Sanitization

✓ Server-side validation on all inputs  
✓ Email format validation  
✓ Password strength requirements  
✓ Protection against injection attacks  

### 7. Route Protection

✓ Middleware-based authentication checks  
✓ Unauthorized users redirected to login  
✓ CORS properly configured  

### 8. Secure Secret Management

Sensitive values stored via environment variables:

- MongoDB credentials
- JWT secret
- Google OAuth credentials
- reCAPTCHA secret
- SMTP credentials
- API keys

---

## 🔄 Authentication Flow

```
                    ┌──────────────┐
                    │ Login Page   │
                    └──────┬───────┘
                           ↓
                 ┌──────────────────┐
                 │ Input Validation │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │   reCAPTCHA      │
                 │   Challenge      │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │  Rate Limiting   │
                 │  Check           │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │ MongoDB User     │
                 │ Lookup           │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │ Bcrypt Password  │
                 │ Comparison       │
                 └────────┬─────────┘
                          ↓
                    YES  / \  NO
                        /   \
                       /     └─→ [Invalid Credentials]
                      /
                     ↓
            ┌──────────────────┐
            │ 2FA Enabled?     │
            └────────┬─────────┘
                 YES / \ NO
                    /   \
                   /     └─→ [Generate JWT]
                  ↓           └─→ [Set Cookie]
         ┌──────────────────┐
         │ TOTP Challenge   │
         │ Sent             │
         └────────┬─────────┘
                  ↓
         ┌──────────────────┐
         │ User Scans QR    │
         │ Code             │
         └────────┬─────────┘
                  ↓
         ┌──────────────────┐
         │ TOTP Verification│
         │ 6-digit Code     │
         └────────┬─────────┘
                  ↓
           [Generate JWT]
           [Set Cookie]
                  ↓
         ┌──────────────────┐
         │ Protected        │
         │ Dashboard        │
         └──────────────────┘
```

---

## 📊 Security Layers Overview

| Layer                    | Purpose                              | Protection |
| ------------------------ | ------------------------------------ | ----------------------------------------- |
| **Input Validation**     | Server-side validation               | Invalid/malformed input                   |
| **Bcrypt Hashing**       | One-way password transformation      | Password compromise                       |
| **reCAPTCHA**            | Bot challenge                        | Automated account takeover                |
| **Rate Limiting**        | Throttle repeated requests           | Brute-force attacks                       |
| **JWT Authentication**   | Stateless session tokens             | Unauthorized access                       |
| **HTTP-Only Cookie**     | Client-side JavaScript access block  | XSS token theft                           |
| **Secure Flag**          | HTTPS-only transmission              | Man-in-the-middle attacks                 |
| **SameSite Cookie**      | Cross-site request forgery reduction | CSRF attacks (partial mitigation)         |
| **2FA / TOTP**           | Second authentication factor         | Compromised passwords                     |
| **Middleware**           | Route-level authentication           | Unauthorized page access                  |
| **Hashed Tokens**        | Reset tokens stored as hashes        | Token interception                        |
| **Device Limiting** | Active session counter in DB | Account sharing & credential leakage |
| **Session Invalidation** | Remote session ID checking via JWT | Stale session & unauthorized device access |
---

## 🚀 Deployment

### Deploy to Vercel

The easiest way to deploy is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy with one click

```bash
# Or deploy via CLI
npm i -g vercel
vercel
```

### Environment Variables for Production

Set these in your Vercel dashboard:

```
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_strong_secret_key
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_production_key
RECAPTCHA_SECRET_KEY=your_production_secret
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_production_client_id
EMAIL_SERVER_USER=your_email@gmail.com
EMAIL_SERVER_PASSWORD=your_app_password
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
```

---

## ⚠️ Important Security Reminders

### Before Going to Production

- [ ] Regenerate all secrets and API keys (do not use development keys)
- [ ] Enable HTTPS on your domain
- [ ] Set secure cookie flags in production environment
- [ ] Verify reCAPTCHA keys match production domain
- [ ] Test 2FA setup flow with real authenticator apps
- [ ] Audit database access and IP whitelisting
- [ ] Set up email service for production (use production Gmail account or SendGrid)
- [ ] Enable rate limiting with appropriate thresholds
- [ ] Configure CORS to allow only your domain
- [ ] Set up monitoring and logging for security events
- [ ] Review MongoDB security groups and access control
- [ ] Enable database backups and recovery testing

### Code Security

- Do not hardcode secrets in source code
- Do not log sensitive data (passwords, tokens, etc.)
- Always validate and sanitize user inputs
- Use prepared statements / ORMs to prevent injection
- Keep dependencies updated (`npm audit fix`)
- Review and test authentication edge cases

### If Secrets Are Exposed

1. **Immediately regenerate all affected secrets**
2. Reset MongoDB password if exposed
3. Regenerate Google OAuth credentials
4. Regenerate reCAPTCHA keys
5. Reset JWT secret and invalidate all existing tokens
6. Monitor for suspicious activity
7. Force password reset for all users
8. Review audit logs for unauthorized access

---

## 🧪 Testing

### Manual Testing Checklist

**Registration:**
- [ ] Valid email and password registration
- [ ] Duplicate email rejection
- [ ] Weak password rejection
- [ ] Email verification flow
- [ ] Resend verification email

**Login:**
- [ ] Valid credentials login
- [ ] Invalid password rejection
- [ ] Non-existent user rejection
- [ ] Rate limiting after repeated attempts
- [ ] reCAPTCHA validation

**2FA:**
- [ ] 2FA setup with authenticator app
- [ ] QR code scanning
- [ ] 6-digit code verification
- [ ] Recovery codes storage
- [ ] 2FA disable flow

**Password Reset:**
- [ ] Forgot password request
- [ ] Email link generation
- [ ] Token expiration validation
- [ ] Password change confirmation

**Session:**
- [ ] Login creates secure cookie
- [ ] Cookie persists across refreshes
- [ ] Logout clears session
- [ ] Protected pages redirect unauthenticated users

---

## 📚 Additional Resources

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/securing-your-application)
- [Bcrypt Documentation](https://github.com/dcodeIO/bcrypt.js)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)
- [Google reCAPTCHA Documentation](https://www.google.com/recaptcha/about/)
- [TOTP Specification (RFC 6238)](https://datatracker.ietf.org/doc/html/rfc6238)
- [HTTP Security Headers](https://owasp.org/www-project-secure-headers/)

---

## 📄 License

This project is released under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📧 Contact & Support

For questions, issues, or suggestions:

- **GitHub Issues:** [Report an Issue](https://github.com/shahed-hassan-fz-rabbi/Secure-Login-system/issues)
- **Email:** contact@example.com
- **Twitter:** [@yourhandle](https://twitter.com/yourhandle)

---

## 🎓 Learning Resources

This project demonstrates:

- Next.js 14 app directory and API routes
- TypeScript for type safety
- MongoDB & Mongoose ODM
- JWT authentication patterns
- 2FA implementation with TOTP
- Security best practices
- Email handling with Nodemailer
- Google OAuth integration
- Rate limiting and bot protection
- Middleware authentication

Perfect for learning modern full-stack authentication!

---

**Last Updated:** August 2026  
**Version:** 1.0.0