# Security Policy

SecOps AI Copilot takes security extremely seriously. We are building a platform designed to protect infrastructure, so our own application must be robust and secure by default.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0.0 | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please **do not** open a public issue. Instead, email your findings privately to our security team. We aim to acknowledge all reports within 48 hours and will keep you updated throughout the remediation process.

## Security Features Implemented

- **Password Hashing**: We use `bcryptjs` with a work factor (salt rounds) of 12.
- **Authentication**: Stateless JWTs signed with a minimum 256-bit secure secret. Tokens expire automatically after 24 hours.
- **SQL Injection Prevention**: The `pg` library is used exclusively with parameterized queries. String concatenation is never used for SQL statements.
- **Cross-Site Scripting (XSS)**: React inherently escapes variables to prevent XSS. We also enforce strict `Content-Security-Policy` headers.
- **HTTP Headers**: `helmet.js` is implemented to enforce `X-Frame-Options`, `X-Content-Type-Options`, and `Strict-Transport-Security`.
- **Rate Limiting**: `express-rate-limit` prevents brute-force login attempts (max 10 attempts per 15 minutes) and limits general API abuse.
- **CORS**: Strictly bound to configured frontend origins.
- **Container Security**: The backend Docker container runs as a non-root `node` user to prevent privilege escalation if a container breakout occurs.
- **Transport Security**: Nginx enforces TLSv1.2 and TLSv1.3 only, disabling outdated, vulnerable protocols.

## Known Limitations

We aim to be transparent about what is *not* yet implemented in the current version:
- **Multi-Factor Authentication (MFA)**: Currently not supported natively within the platform.
- **IP Allowlisting**: No built-in subnet restrictions for dashboard access (must be handled via AWS Security Groups).
- **Compliance**: The platform is not currently audited for SOC2, HIPAA, or PCI-DSS compliance. Use at your own organizational risk.

## Hall of Fame

We would like to thank the following researchers for responsibly disclosing vulnerabilities:
* *(No disclosures yet — be the first!)*
