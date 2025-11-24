# Deployment Guide - Deep Night Ludo Club

## Environment Variables Setup

### 1. Frontend Variables (Koyeb Dashboard mein add karein)

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://jurzzgvupmgfffdodpmz.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1cnp6Z3Z1cG1nZmZmZG9kcG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MTUwNTUsImV4cCI6MjA3OTM5MTA1NX0.w70uHVCN2WOGb9dl3EhhXddMm7NuMLuEuu0kHfRNNFA
VITE_SUPABASE_PROJECT_ID=jurzzgvupmgfffdodpmz

# Node Configuration
NODE_VERSION=18
```

### 2. Backend Variables (Already configured in Supabase Edge Functions)

Backend variables yeh hai lekin **manually add karne ki zarurat NAHI hai** - yeh automatically Supabase/Lovable Cloud se mil rahe hain:

```env
# Supabase Internal (Auto-configured)
SUPABASE_URL=https://jurzzgvupmgfffdodpmz.supabase.co
SUPABASE_ANON_KEY=[auto-configured]
SUPABASE_SERVICE_ROLE_KEY=[auto-configured]
SUPABASE_DB_URL=[auto-configured]

# Telegram Bot (supabase/config.toml mein configured)
TELEGRAM_BOT_TOKEN=8222802213:AAE-n9hBawD5D6EaZ82nt3vFWq6CGKLiXho
```

---

## Koyeb Deployment Steps

### Step 1: GitHub Repository Setup
1. Lovable editor mein top-right "GitHub" button click karein
2. "Connect to GitHub" select karein
3. Repository create karein

### Step 2: Koyeb Configuration
1. [Koyeb.com](https://www.koyeb.com) pe account banayein
2. "Create App" button click karein
3. "GitHub" as source select karein
4. Apni repository choose karein

### Step 3: Build Settings
```
Builder: Buildpack
Build command: npm run build
Run command: npm run preview
Port: 8080
```

### Step 4: Environment Variables Add Karein
Koyeb dashboard mein "Environment Variables" section mein:

| Variable Name | Value |
|--------------|-------|
| `VITE_SUPABASE_URL` | `https://jurzzgvupmgfffdodpmz.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1cnp6Z3Z1cG1nZmZmZG9kcG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MTUwNTUsImV4cCI6MjA3OTM5MTA1NX0.w70uHVCN2WOGb9dl3EhhXddMm7NuMLuEuu0kHfRNNFA` |
| `VITE_SUPABASE_PROJECT_ID` | `jurzzgvupmgfffdodpmz` |
| `NODE_VERSION` | `18` |

### Step 5: Deploy
"Deploy" button click karein aur wait karein

---

## Post-Deployment Tasks

### 1. Telegram Webhook Update
Deploy hone ke baad Koyeb se jo URL milega (jaise `https://your-app.koyeb.app`), usse Telegram webhook update karna hoga.

**Method 1: Browser se (Recommended)**
```
https://api.telegram.org/bot8222802213:AAE-n9hBawD5D6EaZ82nt3vFWq6CGKLiXho/setWebhook?url=https://YOUR-KOYEB-URL.koyeb.app
```

**Method 2: cURL**
```bash
curl -X POST "https://api.telegram.org/bot8222802213:AAE-n9hBawD5D6EaZ82nt3vFWq6CGKLiXho/setWebhook?url=https://YOUR-KOYEB-URL.koyeb.app"
```

### 2. Test Karein
1. Telegram bot ko `/start` command send karein
2. "Place New Table" button click karein
3. Web app open hona chahiye

---

## Troubleshooting

### Issue 1: Web App nahi khul raha
- Check karein ki Koyeb app properly deploy hua hai
- Environment variables sahi se add kiye hain
- Koyeb logs check karein

### Issue 2: Bot respond nahi kar raha
- Telegram webhook properly set hua hai ya nahi check karein
- Edge functions deploy hue hain ya nahi verify karein

### Issue 3: Database connection error
- VITE_SUPABASE_* variables sahi hain ya nahi verify karein
- Supabase project active hai ya nahi check karein

---

## Additional Notes

- **Edge Functions**: Automatically Supabase se deploy hote hain, Koyeb pe manually deploy karne ki zarurat nahi
- **Database**: Lovable Cloud/Supabase automatically manage kar raha hai
- **Updates**: GitHub pe push karne se automatically Koyeb pe deploy ho jayega (if auto-deploy enabled hai)

---

## Security Notes

⚠️ **Important**: 
- Telegram Bot Token ko public repositories mein commit na karein
- Production mein separate bot token use karein
- Environment variables ko secure rakhein
