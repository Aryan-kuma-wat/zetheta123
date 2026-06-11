# Security Policy

This document outlines the security practices, vulnerability disclosure process, and built-in protections implemented in the Real-Time Stock Screener.

---

## 1. Security Mitigations

The following security mitigations are implemented:

- **Security Headers**: The project's `vercel.json` applies HTTP headers on all routes to protect the client:
  - `X-Frame-Options: DENY` (prevents Clickjacking attacks by disabling iframe embedding).
  - `X-Content-Type-Options: nosniff` (forces the browser to adhere to the MIME type sent in the headers).
  - `X-XSS-Protection: 1; mode=block` (enables browser Cross-Site Scripting filters).
  - `Referrer-Policy: strict-origin-when-cross-origin` (restricts referrer data leakage).
- **Environment Isolation**: No credentials, database connections, or API secrets are hardcoded in the frontend. All future environment variables are resolved at the server boundary (via Next.js `.env` configuration).
- **AST Filter Isolation**: The JIT AST Filter Engine compiles mathematical evaluations and comparison logic dynamically using type-checked structural matches instead of calling unsafe Javascript evaluation commands like `eval()` or `new Function(string)`. This prevents Cross-Site Scripting (XSS) injection.

---

## 2. Reporting Vulnerabilities

If you discover a security vulnerability in this project, please notify us immediately through the following process:

1. **Do not disclose publicly**: Avoid opening issues or public pull requests on GitHub for security vulnerabilities.
2. **Contact email**: Send a detailed report describing the vulnerability to **security@yourdomain.com** (TODO: Replace with actual address).
3. **Include details**:
   - Description of the vulnerability.
   - Steps to reproduce (PoC).
   - Potential impact.
4. **Response timeline**: We aim to review and address security reports within 48 hours of receipt.
