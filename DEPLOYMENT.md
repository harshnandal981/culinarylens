# Deployment Guide for Culinary Lens

This document covers deploying the Culinary Lens application to various platforms.

## 1. GitHub Pages (Automatic)

Already configured via GitHub Actions. Your app is deployed at:
- **URL**: https://harshnandal981.github.io/culinarylens

## 2. Vercel

### Setup Steps:

1. **Create a Vercel Account**
   - Visit https://vercel.com and sign up

2. **Connect GitHub Repository**
   - Click "New Project" → "Import Git Repository"
   - Select `culinarylens` repository
   - Vercel will auto-detect it's a Vite project

3. **Set Environment Variables**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add: `VITE_GEMINI_API_KEY` = your API key

4. **Deploy**
   - Click "Deploy"
   - Your app will be live at: `https://culinarylens.vercel.app`

### Optional: GitHub Actions Automation
To enable automated Vercel deployments via GitHub Actions:

1. Generate Vercel tokens:
   ```bash
   vercel tokens create
   ```

2. Get project IDs:
   ```bash
   vercel project ls
   ```

3. Add GitHub secrets:
   - `VERCEL_TOKEN` - Your Vercel token
   - `VERCEL_ORG_ID` - Your Vercel organization ID
   - `VERCEL_PROJECT_ID` - Your project ID

## 3. Netlify

### Setup Steps:

1. **Create a Netlify Account**
   - Visit https://netlify.com and sign up

2. **Connect GitHub Repository**
   - Click "Add new site" → "Import an existing project"
   - Select GitHub → `culinarylens`
   - Netlify will auto-detect Vite configuration

3. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`

4. **Set Environment Variables**
   - Go to Site Settings → Build & Deploy → Environment
   - Add: `VITE_GEMINI_API_KEY` = your API key

5. **Deploy**
   - Click "Deploy"
   - Your app will be live at: `https://culinarylens.netlify.app`

### Optional: GitHub Actions Automation
To enable automated Netlify deployments via GitHub Actions:

1. Get Netlify tokens:
   - Netlify Settings → Applications → Authorize access
   - Create personal access token

2. Get Site ID:
   ```bash
   netlify api getSite
   ```

3. Add GitHub secrets:
   - `NETLIFY_AUTH_TOKEN` - Your Netlify auth token
   - `NETLIFY_SITE_ID` - Your Netlify site ID
   - `VITE_GEMINI_API_KEY` - Your API key

## Comparison

| Platform | Speed | Scalability | Free Tier | Custom Domain |
|----------|-------|-------------|-----------|---------------|
| GitHub Pages | Fast | Good | Yes | Yes |
| Vercel | Very Fast | Excellent | Yes | Yes |
| Netlify | Very Fast | Excellent | Yes | Yes |

## Recommendations

- **Best for Performance**: Vercel (optimized for React)
- **Best for Simplicity**: Netlify (easiest setup)
- **Best for GitHub Users**: GitHub Pages (integrated)

You can deploy to all three simultaneously! Each will have its own live URL.

## Troubleshooting

### Build Fails
- Ensure `npm run build` works locally: `npm run build`
- Check environment variables are set correctly
- Verify Node.js version is 18+

### API Key Not Working
- Ensure `VITE_GEMINI_API_KEY` is set in platform's environment variables
- Verify the key is correct
- Check it's prefixed with `VITE_` for Vite to pick it up

### Deploy Preview Shows 404
- Ensure `netlify.toml` has correct redirect rules
- Verify `dist` folder is the publish directory
