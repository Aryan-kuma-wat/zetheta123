# Deployment Guide

This guide describes how to install, build, configure, and deploy the Real-Time Stock Screener on local environments and production cloud hosting providers (e.g. Vercel).

---

## 1. Local Deployment

### Prerequisites
- **Node.js**: Version 20.x or later.
- **npm**: Version 10.x or later.

### Installation
1. Clone the repository and navigate to the project directory:
   ```bash
   cd stock-screener
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Development Mode
To run the application locally in development mode:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. Features like file auto-refresh, Hot Module Replacement (HMR), and server logs will be active.

### Production Build & Run
To run the production bundle locally:
1. Build the production build:
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   npm start
   ```
The application will serve compiled HTML, optimized Javascript bundles, and styled CSS on port `3000`.

---

## 2. Cloud Deployment (Vercel)

The screener is optimized for deployment on the **Vercel Platform**. It contains a `vercel.json` configuration file to cache static assets and set security headers.

### Deployment Steps
1. **GitHub Sync**: Push the repository to a remote Git account (GitHub/GitLab/Bitbucket).
2. **Import Project**: Log in to Vercel and click **Add New Project**. Select your repository.
3. **Configure Project Settings**:
   - **Framework Preset**: Next.js
   - **Build Command**: `next build` or `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
4. **Environment Variables**: Populate any needed variables (see `.env.example`).
5. **Deploy**: Click **Deploy**. Vercel will build and serve the project globally.

---

## 3. Edge Caching & Security Headers (`vercel.json`)

The application includes a `vercel.json` file in its root directory. This file instructs Vercel to cache static icons and images, and includes security headers to prevent Clickjacking, MIME-sniffing, and XSS attacks:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    },
    {
      "source": "/public/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

---

## 4. Environment Variables

The project does not require any third-party APIs for its default mock data streams. If you integrate live WebSocket connections or third-party quote databases in the future, copy `.env.example` to `.env` and fill in the values:

- `NEXT_PUBLIC_API_URL`: Path to the HTTP endpoints.
- `NEXT_PUBLIC_WS_URL`: Path to the WebSocket streaming node.
