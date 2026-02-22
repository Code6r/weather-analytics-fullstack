# Deploy to Vercel

Your code is pushed to: **https://github.com/Code6r/weather-analytics-fullstack**

## Deploy the frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub login is easiest).

2. Click **Add New…** → **Project**.

3. **Import** the repo `Code6r/weather-analytics-fullstack` from GitHub (grant Vercel access to GitHub if asked).

4. **Configure the project:**
   - **Root Directory:** Click **Edit** and set to `weather-app/frontend`.
   - **Framework Preset:** Vite (should be auto-detected).
   - **Build Command:** `npm run build` (default).
   - **Output Directory:** `dist` (default).

5. **Environment variables (optional):**  
   If you have a deployed backend API, add:
   - **Name:** `VITE_BACKEND_URL`  
   - **Value:** your backend URL (e.g. `https://your-api.vercel.app` or your InsForge backend URL).

6. Click **Deploy**. Vercel will build and give you a URL like `https://weather-analytics-fullstack-xxx.vercel.app`.

---

**Note:** This deploys only the **frontend**. The app uses `VITE_BACKEND_URL` or falls back to `http://localhost:5000`. For production, deploy your backend (e.g. InsForge or a Node server) and set `VITE_BACKEND_URL` in Vercel to that URL.
