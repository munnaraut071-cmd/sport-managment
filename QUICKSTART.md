# Quick Start Guide

## Prerequisites
- Node.js 18+
- MongoDB 6+
- Python 3.9+ (for AI service)

## Installation (3 Steps)

### Step 1: Install Dependencies
```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Install AI service dependencies
cd ../ai-service && pip install -r requirements.txt
```

### Step 2: Setup Environment
```bash
# All .env files are already configured for development
# Just ensure MongoDB is running on port 27017
```

### Step 3: Start Services
```bash
# Terminal 1: Start MongoDB
# Windows: net start MongoDB
# macOS/Linux: mongod

# Terminal 2: Start Backend (port 5001)
cd backend && npm start

# Terminal 3: Start Frontend (port 5173)
cd frontend && npm run dev

# Terminal 4: Start AI Service (port 8000) - Optional
cd ai-service && python main.py
```

## Access Application
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5001/api
- **AI Service:** http://localhost:8000

## Default Login Credentials
- **Admin:** admin@sportkits.com / Admin@123
- **Staff:** staff@sportkits.com / Staff@123

## Features Available
- Full authentication system with JWT
- Kit management (CRUD operations)
- Issue/Return system with due dates
- Reservation system with approvals
- AI-powered demand forecasting
- Real-time notifications
- QR code generation and scanning
- Analytics dashboard with charts
- Dark/Light mode
- Responsive design

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `net start MongoDB`
- Check MongoDB URI in `backend/.env`

### Port Already in Use
- Change ports in respective `.env` files
- Backend: PORT=5001
- Frontend: VITE runs on 5173 by default

### AI Service Not Working
- Ensure Python 3.9+ is installed
- Install dependencies: `pip install -r requirements.txt`

## Need Help?
Check the full README.md for detailed documentation.
