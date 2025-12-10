# Secure File Share

A secure file sharing application with post-quantum cryptography.

## Features

- Post-quantum secure file encryption
- Key exchange and management
- Encrypted file upload and download

## Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or remote)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (optional):
   - Backend: Copy `backend/.env.example` to `backend/.env` and configure
   - Frontend: Copy `frontend/.env.example` to `frontend/.env` and configure

## Running the Application

### Development Mode

1. **Start the backend:**
```bash
cd backend
npm start
```

The backend will start on port 5000 and display:
- Local access URL: `http://localhost:5000`
- Network access URLs: `http://<your-ip>:5000` (for other devices)

2. **Start the frontend:**
```bash
cd frontend
npm run dev
```

The frontend will start on port 5173 and display:
- Local access URL: `http://localhost:5173`
- Network access URLs: `http://<your-ip>:5173` (for other devices)

### Accessing from Different Devices

The application is now configured to accept connections from other devices on your network.

#### On the Same Network (WiFi/LAN):

1. **Find your computer's IP address:**
   - Windows: Run `ipconfig` in Command Prompt and look for "IPv4 Address"
   - Mac/Linux: Run `ifconfig` or `ip addr` and look for your network interface IP

2. **Access from other devices:**
   - Open a browser on another device (phone, tablet, another computer)
   - Navigate to: `http://<your-computer-ip>:5173`
   - Example: `http://192.168.1.100:5173`

3. **The frontend will automatically connect to the backend** using the same IP address

#### Configuration Options:

**Option 1: Auto-detection (Default)**
- The frontend automatically detects the hostname/IP you're using
- If you access via `http://192.168.1.100:5173`, it will connect to `http://192.168.1.100:5000`

**Option 2: Environment Variable**
- Create `frontend/.env` file:
```
VITE_API_BASE_URL=http://192.168.1.100:5000
```
- Or set it when building:
```bash
VITE_API_BASE_URL=http://your-server-ip:5000 npm run build
```

### Production Build

1. **Build the frontend:**
```bash
cd frontend
npm run build
```

2. **Set the API URL for production:**
   - Create `frontend/.env.production`:
```
VITE_API_BASE_URL=http://your-production-server:5000
```

3. **Preview the production build:**
```bash
npm run preview
```

## Troubleshooting

### Can't access from other devices?

1. **Check firewall settings:**
   - Windows: Allow Node.js through Windows Firewall
   - Mac/Linux: Check firewall rules for ports 5000 and 5173

2. **Verify network connection:**
   - Ensure all devices are on the same network
   - Try pinging your computer's IP from another device

3. **Check backend is listening:**
   - The backend should show "Network access: http://<ip>:5000" when starting
   - If it only shows localhost, check the HOST environment variable

4. **CORS issues:**
   - The backend is configured to accept requests from any origin
   - If you still see CORS errors, check the backend CORS configuration

### MongoDB Connection Issues

- Ensure MongoDB is running
- Check the `MONGO_URI` in `backend/.env` or use the default: `mongodb://127.0.0.1:27017/securefiles`

## Project Structure

```
.
├── backend/          # Express.js backend server
│   ├── src/         # Source code
│   └── uploads/     # Uploaded files storage
├── frontend/         # Vite frontend application
│   └── src/         # Source code
└── docs/            # Documentation

```

## License

Private project
"# PostQunatum-file-sharing" 
"# QuantumShield-File-Share" 
"# QuantumShield" 
