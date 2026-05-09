# SPORTKITS - Frontend & Backend Integration Guide

## Overview

The SPORTKITS application uses a centralized API service (`api.js`) that handles all communication between the frontend (client-side HTML/JS) and the backend (Node.js/Express server).

---

## Architecture

### Backend (Server-Side)
- **Framework**: Express.js
- **Port**: 5000 (default)
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Location**: `/server` folder

### Frontend (Client-Side)
- **Tech**: HTML5, CSS3, JavaScript (ES6+)
- **API Service**: Centralized in `api.js`
- **Authentication**: Token-based (stored in localStorage)
- **Location**: `/client` folder

---

## Getting Started

### 1. Start the Backend Server

```bash
cd server
npm install
npm run dev
```

The server will run on `http://localhost:5000`

### 2. Access the Frontend

Open your browser and navigate to:
```
http://localhost:3000  (or open client/index.html directly)
```

### 3. Verify Connection

Check browser console for:
```
✅ Backend Connected: { success: true, message: 'Server is running', ... }
✅ API Service Loaded
```

---

## API Service (`api.js`)

The `api.js` file provides a centralized interface for all backend communication.

### File Structure

```javascript
// Main namespaces
window.API = {
  Auth: AuthAPI,           // Authentication
  Items: ItemAPI,          // Sports kit items
  Transactions: TransactionAPI,  // Issue/Return transactions
  Notifications: NotificationAPI, // User notifications
  Users: UserAPI,          // User management
  Analytics: AnalyticsAPI, // Dashboard analytics
  Anomalies: AnomalyAPI,   // ML anomaly detection
  Reports: ReportAPI,      // Report generation
  TokenManager,            // JWT token handling
  testConnection()         // Health check
}
```

---

## Usage Examples

### Authentication

#### Login
```javascript
const response = await API.Auth.login('user@example.com', 'password123');
if (response.success) {
  console.log('User logged in:', response.user);
  // Token is automatically saved
  window.location.href = 'index.html';
}
```

#### Signup
```javascript
const response = await API.Auth.signup({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
  role: 'user'  // or 'supervisor', 'admin'
});
```

#### Logout
```javascript
await API.Auth.logout();
window.location.href = 'login_new.html';
```

#### Check if User is Logged In
```javascript
if (API.TokenManager.isTokenValid()) {
  const user = API.TokenManager.getUserFromToken();
  console.log('Currently logged in as:', user);
}
```

---

### Items Management

#### Get All Items
```javascript
const response = await API.Items.getAllItems();
if (response.success) {
  console.log('Available items:', response.data);
}
```

#### Get Items with AI Predictions
```javascript
const response = await API.Items.getItemsWithPredictions();
response.data.forEach(item => {
  console.log(`${item.name}:`);
  console.log(`  - Predicted Demand: ${item.aiPrediction.predictedDemand}%`);
  console.log(`  - Urgency: ${item.aiPrediction.urgency}`);
  console.log(`  - Trending Score: ${item.aiPrediction.trendingScore}/100`);
});
```

#### Get Item by ID
```javascript
const item = await API.Items.getItemById('507f1f77bcf86cd799439011');
console.log('Item details:', item);
```

#### Create New Item
```javascript
const newItem = await API.Items.createItem({
  name: 'Cricket Bat',
  category: 'Cricket',
  quantity: 10,
  condition: 'good',
  description: 'Gunn & Moore cricket bat'
});
```

#### Update Item
```javascript
const updated = await API.Items.updateItem('507f1f77bcf86cd799439011', {
  quantity: 8,
  condition: 'fair'
});
```

#### Delete Item
```javascript
await API.Items.deleteItem('507f1f77bcf86cd799439011');
```

---

### Transactions (Issue/Return)

#### Issue Items
```javascript
const transaction = await API.Transactions.createIssueTransaction({
  itemId: '507f1f77bcf86cd799439011',
  quantity: 2,
  userId: '507f1f77bcf86cd799439012',
  expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
});
```

#### Return Items
```javascript
const transaction = await API.Transactions.createReturnTransaction({
  itemId: '507f1f77bcf86cd799439011',
  quantity: 2,
  userId: '507f1f77bcf86cd799439012'
});
```

#### Get Active Transactions
```javascript
const response = await API.Transactions.getActiveTransactions();
console.log('Active transactions:', response.data);
```

#### Get Overdue Transactions
```javascript
const response = await API.Transactions.getOverdueTransactions();
response.data.forEach(trans => {
  console.log(`${trans.itemName} - ${trans.daysOverdue} days overdue`);
});
```

---

### Notifications

#### Get Recent Notifications
```javascript
const response = await API.Notifications.getNotifications(20);
console.log('Notifications:', response.data);
```

#### Get Unread Notifications
```javascript
const response = await API.Notifications.getUnreadNotifications();
const unreadCount = response.data.length;
```

#### Mark as Read
```javascript
await API.Notifications.markAsRead('notification-id');
```

---

### Analytics Dashboard

#### Get Dashboard Summary
```javascript
const response = await API.Analytics.getDashboardData();
const { totalItems, activeTransactions, overdueItems, totalUsers } = response.data;
```

#### Get Category Statistics
```javascript
const response = await API.Analytics.getCategoryStats();
response.data.forEach(category => {
  console.log(`${category.name}: ${category.total} items`);
});
```

#### Get Transaction Statistics
```javascript
const response = await API.Analytics.getTransactionStats('monthly');
console.log('Transaction trends:', response.data);
```

---

### Anomaly Detection

#### Detect Anomalies
```javascript
const response = await API.Anomalies.detectAnomalies();
if (response.data.anomalies.length > 0) {
  console.log('⚠️ Anomalies found:');
  response.data.anomalies.forEach(anomaly => {
    console.log(`${anomaly.type}: ${anomaly.description}`);
  });
}
```

#### Get Anomaly Report
```javascript
const response = await API.Anomalies.getAnomalyReport();
console.log('Recent anomalies:', response.data);
```

---

### Reports

#### Generate Report
```javascript
const response = await API.Reports.generateReport('dashboard', {
  startDate: '2026-01-01',
  endDate: '2026-03-29'
});
const downloadUrl = API.Reports.downloadReport(response.data.reportId);
window.location.href = downloadUrl;
```

---

## Error Handling

All API calls automatically handle errors. Here's how to handle them in your code:

```javascript
try {
  const result = await API.Items.getAllItems();
  console.log('Items:', result.data);
} catch (error) {
  console.error('Failed to load items:', error.message);
  
  // Display error to user
  alert('Error: ' + error.message);
}
```

### Automatic Error Handling
- **401 (Unauthorized)**: Automatically clears token and redirects to login
- **Network Error**: Logs error message to console
- **Invalid Response**: Throws descriptive error

---

## Token Management

Tokens are automatically managed by `TokenManager`:

```javascript
// Get current token
const token = API.TokenManager.getToken();

// Check if token is valid
if (API.TokenManager.isTokenValid()) {
  // User is logged in
}

// Get user info from token
const user = API.TokenManager.getUserFromToken();
console.log('User ID:', user.id);
console.log('User Email:', user.email);

// Manually remove token (logout)
API.TokenManager.removeToken();
```

---

## Backend API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)
- `POST /api/auth/forgot-password` - Request password reset

### Items
- `GET /api/items` - Get all items (requires auth)
- `GET /api/items/:id` - Get item by ID
- `POST /api/items` - Create item (requires auth)
- `PUT /api/items/:id` - Update item (requires auth)
- `DELETE /api/items/:id` - Delete item (requires auth)
- `POST /api/items/:id/upload-image` - Upload item image

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions/issue` - Issue item to user
- `POST /api/transactions/return` - Return item from user
- `PUT /api/transactions/:id` - Update transaction
- `GET /api/transactions?status=overdue` - Get overdue transactions

### Notifications
- `GET /api/notifications` - Get notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

### Analytics
- `GET /api/analytics/dashboard` - Dashboard summary
- `GET /api/analytics/category-stats` - Category statistics
- `GET /api/analytics/transaction-stats` - Transaction trends
- `GET /api/analytics/user-stats` - User statistics

### Anomalies
- `POST /api/anomalies/detect` - Detect anomalies
- `GET /api/anomalies/report` - Get anomaly report
- `GET /api/anomalies/history` - Get anomaly history

### Reports
- `GET /api/reports/generate?type=TYPE` - Generate report
- `GET /api/reports/:id/download` - Download report

### General
- `GET /api/health` - Health check

---

## HTML Files Integration

### Files That Need API Integration

1. **login_new.html** ✅
   - Login form connected to `/api/auth/login`
   - Signup modal connected to `/api/auth/signup`
   - Token management with localStorage

2. **index.html** ✅
   - Displays notifications from `/api/notifications`
   - Shows items from `/api/items`
   - User status from TokenManager

3. **dashboard.html** ✅
   - Analytics from `/api/analytics/dashboard`
   - Charts with transaction data
   - Anomaly detection from `/api/anomalies`

4. **issue-return.html** (TODO)
   - Should connect to `/api/transactions/issue` and `/api/transactions/return`
   - Show available items from `/api/items`

5. **gym.html** (TODO)
   - Show gym inventory from `/api/items?category=Gym`

6. **dance.html** (TODO)
   - Show dance room items from `/api/items?category=Dance`

---

## Testing the Integration

### Quick Test Script

Add this to your browser console:

```javascript
// Test API connection
console.log('🧪 Testing API connection...');

// 1. Health check
await API.testConnection();

// 2. Check authentication
const isLoggedIn = API.TokenManager.isTokenValid();
console.log('Logged in:', isLoggedIn);

// 3. Test items endpoint
try {
  const items = await API.Items.getAllItems();
  console.log('✅ Items endpoint working:', items.data.length, 'items');
} catch (e) {
  console.log('❌ Items endpoint error:', e.message);
}

// 4. Test analytics
try {
  const analytics = await API.Analytics.getDashboardData();
  console.log('✅ Analytics endpoint working:', analytics.data);
} catch (e) {
  console.log('❌ Analytics endpoint error:', e.message);
}
```

---

## Troubleshooting

### Errors

#### "Cannot GET /api/health"
- ❌ Backend is not running
- ✅ Solution: `cd server && npm run dev`

#### "401 Unauthorized"
- ❌ Token expired or invalid
- ✅ Solution: Login again using login form

#### "Network Error"
- ❌ Backend server is down
- ✅ Solution: Check backend logs, restart server

#### "Failed to fetch"
- ❌ CORS issue or server not accessible
- ✅ Solution: Check that server is running on port 5000

### Console Messages

| Message | Meaning | Action |
|---------|---------|--------|
| ✅ Backend Connected | Server is reachable | Continue normally |
| ❌ Backend Connection Failed | Server is down | Start backend server |
| ⚠️ Backend Response Error | API error (not 2xx) | Check API response |
| 🔄 Refreshing dashboard data | Auto-refresh in progress | Wait for completion |

---

## Frontend-Backend Communication Flow

```
┌─────────────────┐
│   HTML Form     │
└────────┬────────┘
         │ User Input
         ▼
┌──────────────────────────┐
│   Event Listener in JS   │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│   API Service (api.js)           │
│  - Validates input               │
│  - Adds auth token               │
│  - Makes fetch() request         │
└────────┬─────────────────────────┘
         │ POST/GET/PUT/DELETE
         ▼ JSON
┌──────────────────────────┐
│   Express Backend        │
│   (server.js)            │
│  - Validates request     │
│  - Checks authentication │
│  - Processes data        │
│  - Queries database      │
└────────┬─────────────────┘
         │ Response JSON
         ▼
┌──────────────────────────────────┐
│   API Service (api.js)           │
│  - Parses response               │
│  - Handles errors                │
│  - Returns to caller             │
└────────┬─────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   Update HTML/DOM               │
│   Display results to user       │
└─────────────────────────────────┘
```

---

## Next Steps

1. ✅ **API Service Created** - `api.js` handles all backend calls
2. ✅ **Authentication Setup** - Login/signup with JWT
3. ✅ **Dashboard Integration** - Analytics and real-time data
4. ⏳ **Remaining Pages Integration**
   - issue-return.html
   - gym.html
   - dance.html
   - register_new.html

5. ⏳ **Backend Enhancements**
   - Password reset endpoint
   - Image upload functionality
   - Additional validations

---

## Document Updates

**Last Updated**: March 29, 2026
**Version**: 1.0.0
**Status**: Integration In Progress ✅

For more information, check the README files in `/server` and `/client` folders.
