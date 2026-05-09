# Quick Start - Backend Integration

## What's Been Done ✅

### Core Files Created
1. **`api.js`** - Centralized API service with all backend endpoints
2. **`dashboard.js`** - Dashboard with real-time analytics and AI predictions
3. **`login_new.html`** - Fully functional login/signup page with backend integration
4. **`issue-return-api.js`** - Issue/Return management with API integration
5. **`BACKEND_INTEGRATION.md`** - Complete integration documentation

### Files Updated
- `index.html` - Added api.js script
- `index.js` - Enhanced with real-time notifications and authentication
- `dashboard.html` - Connected to dashboard.js and Chart.js

---

## Setup Instructions

### Step 1: Start Backend Server
```bash
cd server
npm install
npm run dev
```

Expected output:
```
✅ Server running on port 5000
Environment: development
```

### Step 2: Open Frontend
Option A - Using HTTP Server:
```bash
cd client
# If you have http-server installed
http-server

# Otherwise, use Python
python -m http.server 3000
```

Option B - Direct File:
```
Open: file:///c:/Users/MUNNA/OneDrive/Desktop/Sports Kits Management System/client/login_new.html
```

### Step 3: Verify Connection
Open browser console (F12) and look for:
```
✅ Backend Connected: { success: true, message: 'Server is running', ... }
✅ API Service Loaded
```

---

## Login & Test

### Test Credentials (Create Account First)

1. **Signup**
   - Click "Sign up here" on login page
   - Fill in: Name, Email, Password, Role
   - Click "Create Account"

2. **Login**
   - Email: your-email@example.com
   - Password: your-password
   - Click "Login"

3. **You'll be redirected to the dashboard**

---

## API Usage Quick Reference

### In Browser Console
```javascript
// Test API connection
await API.testConnection();

// Get all items
const items = await API.Items.getAllItems();
console.log(items);

// Get dashboard data
const dashboard = await API.Analytics.getDashboardData();
console.log(dashboard);

// Get unread notifications
const notifs = await API.Notifications.getUnreadNotifications();
console.log(notifs);

// Check current user
const user = API.TokenManager.getUserFromToken();
console.log('Logged in as:', user);
```

---

## Page-by-Page Integration Status

| Page | Status | Notes |
|------|--------|-------|
| login_new.html | ✅ Complete | Login, Signup, Forgot Password |
| index.html | ✅ Integrated | Notifications, Auth status |
| dashboard.html | ✅ Integrated | Analytics, Real-time data |
| issue-return.html | 🔄 Ready | Use issue-return-api.js |
| gym.html | ⏳ Pending | Ready to integrate |
| dance.html | ⏳ Pending | Ready to integrate |
| register_new.html | ⏳ Pending | Ready to integrate |

---

## Common Issues & Solutions

### Issue: "Backend Connection Failed"
```
❌ Backend Connection Failed: Failed to fetch
```

**Solution:**
1. Make sure backend is running: `npm run dev` in `/server`
2. Check backend is on port 5000: `http://localhost:5000/api/health`
3. Wait 2-3 seconds for backend to fully start

---

### Issue: "Cannot POST /api/auth/login"
```
❌ API Request Failed [/auth/login]: API Error: 404
```

**Solution:**
1. Check backend routes are loaded: `server/routes/authRoutes.js` exists
2. Restart backend server
3. Check logs in terminal for errors

---

### Issue: "401 Unauthorized"
```
❌ User is redirected to login page
```

**Solution:**
1. Your token expired - login again
2. Clear localStorage: `localStorage.clear()` in console
3. Refresh page and login

---

### Issue: Database Connection Error
```
MongoError: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:**
1. Start MongoDB server
   - On Windows: `mongod`
   - On Mac: `brew services start mongodb-community`
2. Check MongoDB is running: `mongosh` should connect
3. Restart backend server

---

## Testing Workflows

### Test 1: User Authentication
```
1. Go to login_new.html
2. Click "Sign up here"
3. Create account with:
   - Name: Test User
   - Email: test@example.com
   - Password: Password123
   - Role: User
4. Should redirect to index.html
5. Login button should show "Test User"
```

### Test 2: Dashboard Analytics
```
1. Login as user
2. Go to dashboard.html
3. Should see:
   ✅ Dashboard data loaded
   ✅ Forecast cards populated
   ✅ Transaction charts rendered
   ✅ Anomalies displayed
```

### Test 3: Item Management
```
1. Backend should have some sample items
2. index.html shows "Items loaded: X items"
3. Try filtering by category in search
4. Click on kit card to issue it
```

### Test 4: Notifications
```
1. Backend creates notifications on transactions
2. Bell icon shows notification count
3. Click bell to open notification list
4. Click notification to mark as read
```

---

## API Endpoint Health Check

```javascript
// Copy this to browser console
async function checkAllEndpoints() {
  const token = API.TokenManager.getToken();
  
  const endpoints = [
    { name: 'Health', url: '/health', method: 'GET' },
    { name: 'Get Items', url: '/items', method: 'GET' },
    { name: 'Get Dashboard', url: '/analytics/dashboard', method: 'GET' },
    { name: 'Get Notifications', url: '/notifications', method: 'GET' },
    { name: 'Get Transactions', url: '/transactions', method: 'GET' }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:5000/api${endpoint.url}`, {
        method: endpoint.method,
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      const status = response.ok ? '✅' : '❌';
      console.log(`${status} ${endpoint.name}: ${response.status}`);
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Connection Error`);
    }
  }
}

checkAllEndpoints();
```

---

## Next Steps

1. **Integrate Remaining Pages**
   - Update gym.html to use API
   - Update dance.html to use API
   - Update register_new.html

2. **Backend Enhancements**
   - Implement forgot-password endpoint
   - Add image upload for items
   - Add user profile management

3. **Frontend Improvements**
   - Add loading spinners
   - Better error messages
   - User preferences (theme, notifications)

4. **Data Seeding**
   - Create sample items in database
   - Create sample users for testing
   - Pre-populate categories

---

## File Structure

```
Sports Kits Management System/
├── server/
│   ├── server.js
│   ├── routes/
│   │   ├── authRoutes.js ✅
│   │   ├── itemRoutes.js ✅
│   │   ├── transactionRoutes.js ✅
│   │   └── ... (other routes)
│   ├── models/
│   ├── middleware/
│   └── config/
│
├── client/
│   ├── api.js ✅ NEW - Central API service
│   ├── index.html ✅ Updated
│   ├── index.js ✅ Updated
│   ├── login_new.html ✅ NEW - Full auth page
│   ├── dashboard.html ✅ Updated
│   ├── dashboard.js ✅ NEW - Dashboard logic
│   ├── issue-return-api.js ✅ NEW - Issue/Return logic
│   ├── gym.html (Ready for integration)
│   ├── dance.html (Ready for integration)
│   ├── ... (other files)
│
└── BACKEND_INTEGRATION.md ✅ NEW - Complete guide
```

---

## Troubleshooting Checklist

- [ ] Backend running on port 5000?
- [ ] Can access `http://localhost:5000/api/health`?
- [ ] MongoDB running?
- [ ] Frontend can access `http://localhost:3000` (or via file://)?
- [ ] Console shows "✅ Backend Connected"?
- [ ] Can create account on login_new.html?
- [ ] Can login with created account?
- [ ] Dashboard loads analytics data?
- [ ] Notifications appear?

---

## Getting Help

If something doesn't work:

1. **Check Console** (F12 → Console)
   - Look for red error messages
   - Copy exact error text

2. **Check Network Tab** (F12 → Network)
   - Filter by Fetch/XHR
   - Look for failed requests (red)
   - Check response status and body

3. **Check Server Logs**
   - Terminal where `npm run dev` is running
   - Look for error messages

4. **Clear Cache**
   ```javascript
   // In console
   localStorage.clear()
   // Then refresh page
   ```

---

## Support Files

- 📄 `BACKEND_INTEGRATION.md` - Full API documentation
- 📄 `server/README.md` - Backend setup
- 📄 `client/README.md` - Frontend setup

---

**Last Updated**: March 29, 2026
**Status**: Integration Complete ✅
