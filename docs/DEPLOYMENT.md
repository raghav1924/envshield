# Deployment & Production Operations — EnvShield

**Target:** Environment Variable Linter & Secret Leak Scanner  
**Author:** Jatin Sharma ([https://jatinsh.netlify.app/](https://jatinsh.netlify.app/))

---

## 1. Container Deployment (Docker)

```bash
docker build -t envshield:latest .
docker run -d -p 5151:5151 --name envshield envshield:latest
```

## 2. Process Manager (PM2)

```bash
npm install -g pm2
pm2 start dist/bin.js --name "envshield" -- studio --port 5151
```

## 3. Systemd Service Unit

```ini
[Unit]
Description=EnvShield Background Service
After=network.target

[Service]
Type=simple
User=node
WorkingDirectory=/opt/envshield
ExecStart=/usr/bin/node dist/bin.js studio --port 5151
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```
