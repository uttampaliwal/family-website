---
description: Steps to run after powering on PC
---

# Development Environment Startup

Follow these steps every time you power on your PC and want to work on the family-website project:

## 1. Start Docker Desktop

// turbo

- Open Docker Desktop from the Windows Start menu
- Wait for Docker Desktop to fully start (Docker icon in system tray will be solid)
- This usually takes 30-60 seconds

## 2. Start MongoDB Container

// turbo

```bash
docker-compose up mongo -d
```

This command:

- Starts the MongoDB container in detached mode (runs in background)
- The `-d` flag means it won't block your terminal

## 3. Verify MongoDB is Running

// turbo

```bash
docker ps
```

You should see a container named `family-website-mongo` in the list.

## 4. Start the Development Servers

// turbo

```bash
npm run dev
```

This will start both the API and web development servers.

---

## Troubleshooting

### If MongoDB connection still fails:

1. Check if MongoDB container is healthy:

   ```bash
   docker-compose ps
   ```

2. View MongoDB logs:

   ```bash
   docker-compose logs mongo
   ```

3. Restart MongoDB container:
   ```bash
   docker-compose restart mongo
   ```

### If Docker Desktop won't start:

- Make sure WSL 2 is installed and updated
- Check if virtualization is enabled in BIOS
- Restart your computer

### Alternative: Use MongoDB locally without Docker

If you prefer not to use Docker:

1. Install MongoDB Community Server from mongodb.com
2. MongoDB will run as a Windows service automatically
3. No need to start Docker Desktop
