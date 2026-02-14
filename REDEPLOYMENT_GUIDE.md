# SweetBite Bakery - Re-deployment / Update Guide

Use this guide when you have already deployed the application once and want to **update** it with new changes.

## ✅ Option 1: Automated Update (Recommended)

I have created a new script `deploy-update.sh` specifically for this purpose.

### Step 1: Push your latest changes to GitHub
Make sure all your local changes are committed and pushed to the repository.
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

### Step 2: Copy the update script to your VPS
Open a terminal (PowerShell) on your windows computer and run:
```powershell
scp "d:\Open AI Projects\SweetBakary\SweetBiteBakery\deploy-update.sh" root@72.62.249.216:/root/
```

### Step 3: Run the update script on VPS
SSH into your VPS and run the script:
```powershell
ssh root@72.62.249.216 "chmod +x /root/deploy-update.sh && /root/deploy-update.sh"
```
*(Or if you are already SSH'd in, just run `./deploy-update.sh`)*

The script will automatically:
1.  `git pull` the latest code
2.  `npm install` dependencies
3.  `npm run build` the frontend
4.  `npm run db:push` for database changes
5.  `pm2 restart` the application

---

## 🛠 Option 2: Manual Update (If script fails)

If you prefer to do it manually, here are the exact commands to run on the VPS:

1.  **SSH into VPS**
    ```bash
    ssh root@72.62.249.216
    ```

2.  **Go to project directory**
    ```bash
    cd /var/www/sweetbite-bakery
    ```

3.  **Pull changes**
    ```bash
    git pull
    ```

4.  **Install dependencies and build**
    ```bash
    npm install
    npm run build
    ```

5.  **Update Database (if needed)**
    ```bash
    npm run db:push
    ```

6.  **Restart Application**
    ```bash
    pm2 restart sweetbite-bakery
    ```

---

## 🆘 Troubleshooting

### "Permission denied" during git pull
If you see permission errors, ensure your SSH keys or credentials for GitHub are correct on the VPS.
*Quick fix:* If it asks for username/password, entering your GitHub credentials (use a Personal Access Token as password) works.

### App crashes after update
Check the logs to see why:
```bash
pm2 logs sweetbite-bakery --lines 50
```

### "Database does not exist" or Migration errors
Make sure your `.env` file on the VPS is correct:
```bash
cat .env
```
