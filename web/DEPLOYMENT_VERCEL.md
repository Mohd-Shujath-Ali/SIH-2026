# Deploying to Vercel

This application is fully configured for deployment on **Vercel** with a serverless Node.js backend (`/api`) and a high-performance React + Vite frontend.

---

## 1. Prerequisites
- A [Vercel account](https://vercel.com)
- Your Google Gemini API Key
- Your Raspberry Pi OCR URL (e.g., `https://ali.tail743e77.ts.net`)

---

## 2. Deploy via GitHub / Git (Recommended)

1. **Push your code to GitHub, GitLab, or Bitbucket**:
   ```bash
   git init
   git add .
   git commit -m "Deploy to Vercel"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Import into Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Select your Git repository.
   - Vercel will automatically detect **Vite** via `vercel.json`.

3. **Configure Environment Variables** in the Vercel dashboard:
   Expand **Environment Variables** and add:
   | Variable Name | Value | Description |
   |---|---|---|
   | `GEMINI_API_KEY` | `your_gemini_api_key` | Required for AI extraction & reasoning |
   | `OCR_PI_BASE_URL` | `https://ali.tail743e77.ts.net` | Raspberry Pi OCR endpoint |
   | `OCR_PI_TIMEOUT_MS` | `45000` | OCR request timeout (ms) |

4. Click **Deploy**.

---

## 3. Deploy via Vercel CLI

Alternatively, deploy directly from your local terminal:

1. **Install and log in to Vercel CLI**:
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Add Environment Variables**:
   ```bash
   vercel env add GEMINI_API_KEY
   vercel env add OCR_PI_BASE_URL
   vercel env add OCR_PI_TIMEOUT_MS
   ```

4. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

---

## Architecture on Vercel
- **Frontend**: Compiled using `vite build` into `dist/` and distributed globally via Vercel's Edge Network / CDN.
- **Backend API (`/api/*`)**: Handled by the bundled serverless function in `api/index.js` (built from `server/apiEntry.ts`) with execution duration configured up to 60s in `vercel.json`.
- **Hardware Integration**: Forwards OCR/HTR document processing over Tailscale to the live Raspberry Pi endpoint.
