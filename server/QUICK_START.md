# 🚀 Quick Start Guide

## ⚡ 5-Minute Setup

```bash
# 1. Navigate to backend
cd sports-kit-backend

# 2. Install & Run
npm install
npm run dev

# 3. Server running on
http://localhost:5000

# 4. Test endpoint
curl http://localhost:5000/api/health
```

---

## 🔑 First Steps

### Step 1: Create an Account
```bash
POST http://localhost:5000/api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}

Response: { accessToken: "jwt_token_here", user: {...} }
```

### Step 2: Login
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response: { accessToken: "jwt_token_here", user: {...} }
```

### Step 3: Add Auth Header to All Requests
```bash
Authorization: Bearer jwt_token_here
```

---

## 📋 Most Used Endpoints

### Get All Kits
```
GET /api/items
```
Returns all sports kits with AI predictions

### Issue a Kit
```
POST /api/items/{id}/issue
Body: { quantity: 2 }
```
Issue kits to user and auto-create transaction

### Return a Kit
```
POST /api/items/{id}/return
Body: { quantity: 2, isDamaged: false, isLost: false }
```

### Get Dashboard Data
```
GET /api/analytics/dashboard
```
Everything needed for the dashboard

### Check Anomalies
```
GET /api/anomalies/detect-all
```
ML-based anomaly detection for suspicious patterns

### Generate Reports
```
GET /api/reports/export/master-report
```
Export complete system data as JSON

---

## 📊 Common Workflows

### Add New Kit
```javascript
POST /api/items
{
  "name": "Basketball",
  "category": "Sports",
  "quantity": 50,
  "baseDemand": 5,
  "reorderLevel": 10,
  "unitPrice": 800
}
```

### Track Return
```javascript
POST /api/items/{id}/return
{
  "quantity": 1,
  "isDamaged": true,
  "isLost": false,
  "remarks": "Torn seam"
}
```

### Get Smart Recommendations
```javascript
GET /api/analytics/reorder/recommendations
```

### Broadcast Notification
```javascript
POST /api/notifications/broadcast (Admin only)
{
  "title": "New kits arrived",
  "message": "Badminton rackets now in stock"
}
```

---

## 🔐 Authentication

**Login & Get Token**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@school.com",
    "password": "securepass"
  }'
```

**Use Token in Headers**
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1..." \
  http://localhost:5000/api/items
```

**Check Token Validity**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/auth/me
```

---

## 🎯 Role-Based Access

| Operation | User | Supervisor | Admin |
|-----------|------|-----------|-------|
| View items | ✅ | ✅ | ✅ |
| Issue/Return | ✅ | ✅ | ✅ |
| Create items | ❌ | ✅ | ✅ |
| View analytics | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

---

## 🛠️ Troubleshooting

**Server won't start**
```bash
# Check if port 5000 is free
netstat -ano | findstr :5000
# Kill process: taskkill /pid <PID> /f
# Or change PORT in .env
```

**MongoDB connection error**
```bash
# Ensure MongoDB is running
# Check connection string in .env
# Test: mongodb://localhost:27017
```

**Token expired**
```bash
# Login again to get new token
POST /api/auth/login
```

**Permission denied**
```bash
# Check user role: GET /api/auth/me
# Ensure you have required permissions
# Contact admin for access upgrades
```

---

## 📊 Database Reset

```bash
# Clear all data and start fresh (dev only)
# Stop server: Ctrl+C
# Delete MongoDB: mongod --remove
# Restart MongoDB with new instance
npm run dev
```

---

## 💾 Backup & Export

```bash
# Export full system
GET /api/reports/export/master-report

# Export just inventory
GET /api/reports/export/inventory

# Export transactions
GET /api/reports/export/transactions?startDate=2024-01-01&endDate=2024-03-31
```

---

## 📱 Frontend Integration

```javascript
// Login
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
})
.then(r => r.json())
.then(data => localStorage.setItem('token', data.accessToken))

// Get items with auth
fetch('/api/items', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
})
.then(r => r.json())
.then(data => console.log(data))
```

---

## 🚀 Going Live

1. **Setup MongoDB Atlas** - Free cloud database
2. **Update .env** with production values
3. **Set JWT_SECRET** to strong random string
4. **Deploy to Heroku/AWS/DigitalOcean**
5. **Update frontend API URL**
6. **Enable HTTPS**
7. **Setup monitoring & backups**

---

## 📚 Full Documentation

See `COMPLETE_BACKEND.md` for:
- Complete API reference
- All endpoints with examples
- Database schema details
- ML model descriptions
- Advanced configuration
- Performance optimization

---

**Status**: ✅ Production Ready
**Endpoints**: 70+
**Features**: 8 major systems
**Models**: 4 core + utilities
