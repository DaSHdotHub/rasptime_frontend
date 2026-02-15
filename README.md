# Rasptime Frontend

Admin dashboard for the Rasptime timeclock system.

## Tech Stack

- React 18 + Vite
- Tailwind CSS
- React Query
- date-fns

## Development
```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`

## Production Deployment

### 1. Build
```bash
npm run build
```

Creates `dist/` folder with static files.

### 2. Copy to Server
```bash
scp -r dist/* admshaulov@192.168.178.157:~/projects/rasptime-frontend/
```

### 3. Server Setup (First Time Only)

#### Install Nginx
```bash
sudo apt update
sudo apt install nginx -y
```

#### Create Nginx Config
```bash
sudo nano /etc/nginx/sites-available/rasptime
```

Paste:
```nginx
server {
    listen 3000;
    server_name _;

    root /home/admshaulov/projects/rasptime-frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/rasptime /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Set Permissions
```bash
chmod 755 /home/admshaulov
chmod 755 /home/admshaulov/projects
chmod 755 /home/admshaulov/projects/rasptime-frontend
chmod -R 755 /home/admshaulov/projects/rasptime-frontend/*
```

### 4. Deploy Updates

After building new version:
```bash
# From local machine
scp -r dist/* admshaulov@192.168.178.157:~/projects/rasptime-frontend/

# On server (if needed)
sudo systemctl reload nginx
```

## URLs

- **Development:** http://localhost:5173
- **Production:** http://192.168.178.157:3000
- **API Backend:** http://192.168.178.157:8081

## Features

- User list with status (clocked in/out)
- User details modal (RFID, role, created date)
- Time entries modal with date range filter
- Total hours and days worked calculation
