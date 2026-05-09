# SPORTKITS - Complete Project Guide

## Project Overview
Full-stack Sports Inventory Management System with AI-powered insights, real-time notifications, and smart automation.

## Architecture

### Frontend (React + Vite + Tailwind + shadcn/ui)
```
/frontend
├── src/
│   ├── components/ui/          # shadcn/ui components
│   ├── components/             # Custom components (Navbar, Sidebar, KitCard)
│   ├── context/                # AuthContext, SocketContext
│   ├── pages/                  # Login, Register, Dashboard, Kits, Admin, AI Dashboard
│   ├── lib/utils.js            # Utility functions
│   ├── App.jsx                 # Main routing
│   └── main.jsx                # Entry point
├── package.json
├── vite.config.js
├── tailwind.config.js
└── index.html
```

### Backend (Node.js + Express + MongoDB + Socket.io)
```
/server
├── ai/                         # AI modules
│   ├── academicCalendar.js     # Tournament/event forecasting
│   ├── demandPrediction.js     # Demand forecasting
│   ├── recommendation.js       # Purchase recommendations
│   ├── behaviorAnalysis.js     # User risk analysis & smart reminders
│   └── reminderEngine.js       # Automated reminder system
├── models/
│   ├── User.js                 # User schema with risk scoring
│   ├── Kit.js                  # Kit schema with AI predictions
│   ├── Transaction.js          # Issue/return tracking
│   └── Notification.js         # Notifications schema
├── routes/
│   ├── auth.js                 # Login/register
│   ├── kits.js                 # Kit CRUD + QR codes
│   ├── transactions.js         # Issue/return operations
│   ├── users.js                # User management
│   ├── ai.js                   # AI API endpoints
│   └── analytics.js            # Dashboard analytics
├── middleware/
│   └── auth.js                 # JWT verification
├── server.js                   # Express + Socket.io setup
└── .env                        # Environment variables
```

## Features Implemented

### 1. Authentication System (JWT)
- ✅ JWT-based authentication
- ✅ Role-based access (Admin, User, Staff)
- ✅ Password hashing with bcrypt
- ✅ Protected routes

### 2. Kit Management
- ✅ CRUD operations for kits
- ✅ QR code generation for quick issue/return
- ✅ Stock tracking (available/total)
- ✅ Low stock alerts
- ✅ Category-based organization

### 3. Transaction System
- ✅ Issue kits to users
- ✅ Return kits with QR code scanning
- ✅ Due date tracking
- ✅ Overdue detection
- ✅ Transaction history

### 4. AI Features

#### A. Demand Prediction
- Predicts which kits will be in high demand
- Based on:
  - Historical usage patterns
  - Academic calendar (semesters, breaks)
  - Sports tournaments and events
  - Seasonal patterns
- API: `GET /api/ai/demand-prediction`

#### B. Academic Calendar Integration
- Configured events:
  - Inter-College Cricket Tournament (March)
  - Annual Sports Meet (February)
  - Football Championship (September)
  - Basketball League (November)
  - Badminton Tournament (August)
  - Hockey Championship (December)
- API: `GET /api/ai/academic-calendar`

#### C. Restocking Alerts
- Alerts admin to restock before tournaments
- 14-30 days advance notice
- Quantity recommendations based on event size
- API: `GET /api/ai/restocking-alerts`

#### D. Smart Reminders (Behavior Learning)
Learns each student's return behavior and sends personalized reminders:

**3 Reminder Schedules:**
1. **Intensive** (High-risk users: >70% late returns)
   - 3 days before due
   - 1 day before due
   - Due day (URGENT)
   - 1 day after overdue

2. **Early** (Moderate-risk: 30-70% late)
   - 2 days before due
   - Due day
   - 1 day after overdue

3. **Minimal** (Low-risk: <30% late)
   - Due day only

API: `GET /api/ai/smart-reminders/:userId`

#### E. Purchase Recommendations
- Recommends what new kits to buy
- Based on demand trends and seasonal patterns
- Budget-aware recommendations
- Urgency scoring
- API: `GET /api/ai/purchase-recommendations`

#### F. Seasonal Buying Guide
- Spring: Cricket, Football, Tennis
- Summer: Cricket, Football, Basketball, Volleyball
- Monsoon: Badminton, Table Tennis
- Winter: Hockey, Football, Badminton
- API: `GET /api/ai/seasonal-recommendations`

#### G. Risk Analysis
- Calculates user risk scores (0-100)
- Factors: late returns, avg return time, overdue items
- User classifications: Exemplary, Regular, High-Risk, New
- API: `GET /api/ai/risk-analysis`

#### H. Return Prediction
- Predicts if user will return on time
- Probability scoring per active loan
- Early warning for potential late returns
- API: `GET /api/ai/return-prediction/:userId`

### 5. Real-Time Features (Socket.io)
- Real-time notifications for:
  - Due date reminders
  - Overdue alerts
  - Kit issued/returned
  - Low stock warnings
  - AI predictions updated

### 6. Dashboard & Analytics
- Stats cards (total kits, issued, overdue, users)
- Usage charts with Recharts
- Recent transactions
- AI insights summary
- Category-wise distribution

## API Endpoints Reference

### Authentication
```
POST /api/auth/register          # Register new user
POST /api/auth/login             # Login user
GET  /api/auth/me                # Get current user
PUT  /api/auth/profile           # Update profile
PUT  /api/auth/password          # Change password
```

### Kits
```
GET    /api/kits                 # List all kits
GET    /api/kits/:id             # Get kit details
POST   /api/kits                 # Create kit (Admin)
PUT    /api/kits/:id             # Update kit (Admin)
DELETE /api/kits/:id             # Delete kit (Admin)
GET    /api/kits/low-stock       # Get low stock kits
```

### Transactions
```
GET  /api/transactions           # List transactions
POST /api/transactions/issue     # Issue a kit
POST /api/transactions/return    # Return a kit
GET  /api/transactions/my-history # User's history
GET  /api/transactions/overdue   # Get overdue items
```

### AI Endpoints
```
GET /api/ai/demand-prediction        # Demand forecast
GET /api/ai/comprehensive-forecast   # Full forecast with calendar
GET /api/ai/academic-calendar        # Calendar & events
GET /api/ai/restocking-alerts        # Restock alerts
GET /api/ai/purchase-recommendations # What to buy
GET /api/ai/seasonal-recommendations # Seasonal buying
GET /api/ai/risk-analysis            # Risky users
GET /api/ai/user-behavior/:userId    # User analysis
GET /api/ai/smart-reminders/:userId  # Reminder schedule
GET /api/ai/return-prediction/:userId # Return predictions
GET /api/ai/user-preferences/:userId # Sport preferences
GET /api/ai/insights                 # Comprehensive insights
```

## Database Schema

### User
```javascript
{
  name: String,
  email: String,
  password: String (hashed),
  role: ['user', 'admin', 'staff'],
  riskScore: Number (0-100),
  totalIssues: Number,
  totalReturns: Number,
  lateReturns: Number
}
```

### Kit
```javascript
{
  name: String,
  category: String,
  description: String,
  quantity: Number,
  available: Number,
  status: ['active', 'inactive', 'maintenance'],
  aiPrediction: String,
  predictedDemand: Number,
  qrCode: String
}
```

### Transaction
```javascript
{
  user: ObjectId (ref: User),
  kit: ObjectId (ref: Kit),
  type: ['issue', 'return'],
  issueDate: Date,
  dueDate: Date,
  returnDate: Date,
  status: ['active', 'returned', 'overdue'],
  reminderSent: Boolean
}
```

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sportkits
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

## How to Run

### 1. Install Dependencies
```bash
# Root level (installs concurrently)
npm install

# Install all dependencies
npm run install-all
```

### 2. Setup MongoDB
- Install MongoDB locally or use MongoDB Atlas
- Update `MONGODB_URI` in `/server/.env`

### 3. Start Development Servers
```bash
# Start both frontend and backend
npm run dev

# Or individually:
npm run server   # Backend only
npm run client   # Frontend only
```

### 4. Access Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sportkits.com | admin123 |
| User | user@sportkits.com | user123 |

## Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- shadcn/ui (Radix UI primitives)
- Framer Motion
- Recharts
- Socket.io Client
- QR Code React
- Axios

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- Socket.io
- JWT (jsonwebtoken)
- bcryptjs
- node-cron (scheduled tasks)

## Key Features Summary

✅ **Frontend UI** - Modern dark theme with glassmorphism
✅ **Backend APIs** - RESTful API with 30+ endpoints
✅ **Authentication** - JWT with role-based access
✅ **AI Features** - 8 AI modules for prediction & recommendations
✅ **Real-time** - Socket.io for live notifications
✅ **QR Codes** - Quick issue/return scanning
✅ **Smart Reminders** - Behavior-learning reminder system
✅ **Academic Calendar** - Tournament-aware forecasting
✅ **Risk Analysis** - User behavior scoring
✅ **Analytics** - Dashboard with charts & insights

## Next Steps / Enhancements

1. Add OpenAI chatbot integration
2. Mobile app (React Native)
3. Email notifications (SendGrid/Nodemailer)
4. SMS reminders (Twilio)
5. Barcode scanner integration
6. Inventory reports export (PDF/Excel)
7. Multi-tenant support for multiple institutions

---

Built with ❤️ for smarter sports inventory management!
