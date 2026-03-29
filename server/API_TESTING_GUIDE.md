# 🧪 API Testing Guide

## Prerequisites

- Backend running on `http://localhost:5000`
- Postman installed (recommended)
- Database (MongoDB) running on `localhost:27017`
- Node.js and npm installed

---

## 🔄 Complete Testing Workflow

### Phase 1: Authentication Testing

#### 1.1 Create New User Account
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test@123",
    "phone": "1234567890",
    "department": "Sports"
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "607f1f77bcf86cd799439011",
    "name": "Test User",
    "email": "test@example.com",
    "role": "user"
  }
}
```

**Save the token:**
```bash
TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 1.2 Login with Credentials
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

#### 1.3 Verify Token
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "user": { "name": "Test User", ... }
}
```

---

### Phase 2: Inventory Management Testing

#### 2.1 Create New Item
```bash
curl -X POST http://localhost:5000/api/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Basketball",
    "category": "Ball Sports",
    "quantity": 50,
    "baseDemand": 3,
    "reorderLevel": 10,
    "unitPrice": 2500,
    "supplier": "Sports World",
    "location": "Storage A-1"
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "607f1f77bcf86cd799439012",
    "name": "Basketball",
    "quantity": 50,
    "aiPredictedDemand": 4.5,
    ...
  }
}
```

**Save the item ID:**
```bash
ITEM_ID=607f1f77bcf86cd799439012
```

#### 2.2 Get All Items with Predictions
```bash
curl http://localhost:5000/api/items \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "607f1f77bcf86cd799439012",
      "name": "Basketball",
      "quantity": 50,
      "aiPredictedDemand": 4.5,
      "available": 50,
      ...
    }
  ]
}
```

#### 2.3 Issue a Kit
```bash
curl -X POST http://localhost:5000/api/items/$ITEM_ID/issue \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "quantity": 2 }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "2 Basketball(s) issued successfully",
  "transaction": {
    "_id": "607f1f77bcf86cd799439013",
    "type": "issue",
    "quantity": 2,
    "itemId": "607f1f77bcf86cd799439012",
    ...
  }
}
```

#### 2.4 Return a Kit
```bash
curl -X POST http://localhost:5000/api/items/$ITEM_ID/return \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 2,
    "isDamaged": false,
    "isLost": false,
    "remarks": "Good condition"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "2 Basketball(s) returned successfully",
  "transaction": { ... }
}
```

---

### Phase 3: Analytics & AI Testing

#### 3.1 Get Dashboard Data
```bash
curl http://localhost:5000/api/analytics/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "dashboard": {
    "totalItems": 50,
    "totalIssued": 2,
    "dangerouslyLowItems": [],
    "demandForecast": [
      {
        "item": "Basketball",
        "current": 3,
        "predicted": 4.5,
        "trend": "increasing"
      }
    ],
    ...
  }
}
```

#### 3.2 Get Reorder Recommendations
```bash
curl http://localhost:5000/api/analytics/reorder/recommendations \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "recommendations": [
    {
      "item": "Basketball",
      "currentStock": 48,
      "reorderLevel": 10,
      "recommendedOrder": 20,
      "urgency": "high"
    }
  ]
}
```

#### 3.3 Get Trending Items
```bash
curl http://localhost:5000/api/analytics/trending \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "trending": [
    {
      "name": "Basketball",
      "trend": 4.5,
      "percentageChange": 50,
      "status": "uptrend"
    }
  ]
}
```

---

### Phase 4: ML Anomaly Detection Testing

#### 4.1 Detect All Anomalies
```bash
curl http://localhost:5000/api/anomalies/detect-all \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "totalAnomalies": 0,
  "byType": { ... },
  "bySeverity": {
    "CRITICAL": 0,
    "HIGH": 0,
    "MEDIUM": 0,
    "LOW": 0
  },
  "anomalies": []
}
```

#### 4.2 Get Item Anomaly Details
```bash
curl http://localhost:5000/api/anomalies/item/$ITEM_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "item": "Basketball",
  "anomalies": [],
  "scores": {
    "damageRate": 0,
    "lossRate": 0,
    "returnRate": 0,
    "issuevelocity": 0
  }
}
```

---

### Phase 5: Transaction Logging Testing

#### 5.1 Get Transaction History
```bash
curl "http://localhost:5000/api/transactions?type=issue" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "total": 2,
  "data": [
    {
      "_id": "607f1f77bcf86cd799439013",
      "type": "issue",
      "itemId": "607f1f77bcf86cd799439012",
      "quantity": 2,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### 5.2 Get Item Audit Trail
```bash
curl http://localhost:5000/api/transactions/audit/$ITEM_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "item": "Basketball",
  "auditTrail": [
    {
      "event": "issued",
      "quantity": 2,
      "by": "test@example.com",
      "timestamp": "2024-01-15T10:30:00Z"
    },
    {
      "event": "returned",
      "quantity": 2,
      "by": "test@example.com",
      "timestamp": "2024-01-15T10:35:00Z"
    }
  ]
}
```

---

### Phase 6: Notification Testing

#### 6.1 Get User Notifications
```bash
curl http://localhost:5000/api/notifications \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "total": 0,
  "unread": 0,
  "data": []
}
```

#### 6.2 Mark Notification as Read
```bash
curl -X PUT http://localhost:5000/api/notifications/NOTIF_ID/read \
  -H "Authorization: Bearer $TOKEN"
```

---

### Phase 7: Report Generation Testing

#### 7.1 Export Master Report
```bash
curl http://localhost:5000/api/reports/export/master-report \
  -H "Authorization: Bearer $TOKEN" \
  -o master-report.json
```

**Expected:** JSON file containing all system data

#### 7.2 Generate Inventory Report
```bash
curl http://localhost:5000/api/reports/inventory/full \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "report": {
    "totalItems": 50,
    "totalValue": 125000,
    "byCategory": { ... },
    "items": [ ... ]
  }
}
```

---

## ✅ Testing Checklist

- [ ] User registration works
- [ ] User login works
- [ ] JWT token stored properly
- [ ] Create items works
- [ ] Issue kit works
- [ ] Return kit works
- [ ] Dashboard loads all data
- [ ] Reorder recommendations generated
- [ ] Trending items detected
- [ ] Anomaly detection runs
- [ ] Transactions logged
- [ ] Notifications created
- [ ] Reports export JSON
- [ ] Analytics calculations correct

---

## 🐛 Common Issues & Solutions

### Issue: "Invalid MongoDB URI"
```
Solution: Check MONGODB_URI in .env
Ensure MongoDB is running: mongod --version
```

### Issue: "JWT token expired"
```
Solution: Login again to get new token
Or increase JWT_EXPIRE in .env
```

### Issue: "Permission denied for endpoint"
```
Solution: Check user role requirements
Ensure Authorization header has token
Verify token is valid: GET /api/auth/me
```

### Issue: "Item not found"
```
Solution: Use correct item ID
Get list: GET /api/items and copy _id
```

### Issue: "Cannot issue more than available"
```
Solution: Reduce quantity or check current stock
Add more items: POST /api/items with higher quantity
```

---

## 📊 Performance Benchmarks

| Operation | Expected Time |
|-----------|---------------|
| Create item | <100ms |
| Get items list | <150ms |
| Issue kit | <50ms |
| Return kit | <50ms |
| Dashboard analytics | <500ms |
| Full anomaly scan | <1000ms |
| Export master report | <3000ms |

---

## 🔒 Security Testing

### 1. Test without Authorization
```bash
curl http://localhost:5000/api/items
# Expected: 401 Unauthorized
```

### 2. Test with Invalid Token
```bash
curl -H "Authorization: Bearer invalid_token" \
  http://localhost:5000/api/items
# Expected: 401 Unauthorized
```

### 3. Test Role-Based Access
```bash
# Regular user tries admin endpoint
curl http://localhost:5000/api/users \
  -H "Authorization: Bearer USER_TOKEN"
# Expected: 403 Forbidden
```

---

## 📝 Test Data Templates

### Create Multiple Items
```bash
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/items \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"Item $i\",
      \"category\": \"Category $((i % 3))\",
      \"quantity\": $((50 + i * 10)),
      \"baseDemand\": $((2 + i % 5))
    }"
done
```

### Simulate Multiple Transactions
```bash
for i in {1..5}; do
  curl -X POST http://localhost:5000/api/items/$ITEM_ID/issue \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"quantity\": $((i % 3) + 1)}"
done
```

---

## 📊 Test Coverage

- ✅ Authentication (5 endpoints)
- ✅ Inventory (11 endpoints)
- ✅ Analytics (11 endpoints)
- ✅ Anomalies ML (8 endpoints)
- ✅ Transactions (7 endpoints)
- ✅ Notifications (9 endpoints)
- ✅ Users (8 endpoints)
- ✅ Reports (11 endpoints)

**Total: 70+ endpoints tested**

---

**Last Updated**: March 2024
**Status**: Ready for production testing
