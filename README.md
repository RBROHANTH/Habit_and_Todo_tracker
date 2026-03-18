# HABIT OS — Rohanth's Execution System

## Local Setup
```bash
npm install
# Create .env file:
echo "MONGODB_URI=your_mongodb_connection_string" > .env
npm start
```

## Deploy on Render

### Step 1 — MongoDB Atlas
1. Go to mongodb.com/atlas → create free cluster
2. Create database user with password
3. Whitelist IP: 0.0.0.0/0 (allow all)
4. Get connection string: mongodb+srv://user:pass@cluster.mongodb.net/habitOS

### Step 2 — Push to GitHub
```bash
git init
git add .
git commit -m "habit os init"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### Step 3 — Deploy on Render
1. render.com → New Web Service
2. Connect your GitHub repo
3. Settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Environment Variables:
   - MONGODB_URI = your atlas connection string
5. Deploy

### Done. Your tracker is live.

## File Structure
```
habit-tracker/
├── server.js          # Express + MongoDB backend
├── package.json
├── .env               # NOT committed to git
└── public/
    └── index.html     # Frontend (served by Express)
```
"# Habit_and_Todo_tracker" 
