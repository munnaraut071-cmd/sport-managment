# Advanced Sports Kits Management API - Complete Documentation

## 🚀 Features

- ✅ **Authentication & Authorization** - JWT-based auth with role-based access control
- ✅ **User Roles** - Admin, Supervisor, and User roles with different permissions
- ✅ **AI Demand Prediction** - Intelligent forecasting based on academic calendar and historical data
- ✅ **Image Upload** - Multer-based image upload for kit photos
- ✅ **Analytics Dashboard** - Complete inventory analytics and insights
- ✅ **Smart Reminders** - Automated alerts for reordering and returns
- ✅ **Trending Analysis** - Track most used kits and trending items

---

## 🔐 Authentication Endpoints

### POST /api/auth/signup
Create a new user account

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure123",
  "phone": "9876543210",
  "studentId": "STU001",
  "role": "user"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "123abc",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

---

### POST /api/auth/login
Authenticate user and get JWT token

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "secure123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "123abc",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "avatar": "https://..."
  }
}
```

---

### GET /api/auth/me
Get current authenticated user profile

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123abc",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "phone": "9876543210",
    "department": "Sports",
    "avatar": "https://...",
    "lastLogin": "2024-03-29T10:30:00Z"
  }
}
```

---

### PUT /api/auth/profile
Update user profile information

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Updated",
  "phone": "9876543211",
  "department": "Physical Education"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { /* updated user object */ }
}
```

---

### POST /api/auth/change-password
Change user password

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "secure123",
  "newPassword": "newsecure456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

### POST /api/auth/verify-token
Verify if JWT token is still valid

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Token is valid",
  "user": { /* user object */ }
}
```

---

## 📦 Items/Kits Endpoints

### GET /api/items
Get all sports kits with optional filters

**Query Parameters:**
- `category` - Filter by category (Cricket, Football, etc.)
- `active` - Filter by active status (true/false)
- `withPredictions` - Include AI predictions (true/false)

**Headers:**
```
Authorization: Bearer <token>
```

**Example:**
```
GET /api/items?category=Cricket&withPredictions=true
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "123",
      "name": "Cricket Bat",
      "category": "Cricket",
      "quantity": 50,
      "issued": 5,
      "available": 45,
      "aiPrediction": {
        "predictedDemand": 60,
        "urgency": "medium",
        "trendingScore": 75
      }
    }
  ]
}
```

---

### GET /api/items/:id
Get single item details

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": { /* item details */ }
}
```

---

### GET /api/items/:id/ai-prediction
Get AI predictions for specific item

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "itemId": "123",
    "name": "Cricket Bat",
    "category": "Cricket",
    "baseDemand": 8,
    "predictedDemand": 60,
    "currentStock": 45,
    "urgency": "medium",
    "trendingScore": 75,
    "needsReorder": false
  }
}
```

---

### POST /api/items
Create new sports kit (Admin/Supervisor only)

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "name": "Cricket Bat",
  "category": "Cricket",
  "description": "Premium wooden cricket bat",
  "quantity": 50,
  "unitPrice": 2500,
  "reorderLevel": 10,
  "supplier": "Sports Co",
  "location": "Storage A",
  "baseDemand": 8
}
```

**Response:**
```json
{
  "success": true,
  "message": "Item created successfully",
  "data": { /* created item */ }
}
```

---

### POST /api/items/:id/upload-image
Upload image for a kit

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `image` - Image file (JPEG, PNG, WEBP, GIF max 5MB)

**Response:**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "itemId": "123",
    "imageUrl": "/uploads/image-123456789.jpg"
  }
}
```

---

### POST /api/items/:id/issue
Issue kit to student/team

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "quantity": 5,
  "studentId": "STU001",
  "remarks": "For cricket tournament"
}
```

**Response:**
```json
{
  "success": true,
  "message": "5 kit(s) issued successfully",
  "data": { /* updated item */ }
}
```

---

### POST /api/items/:id/return
Return kit with damage tracking

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "quantity": 3,
  "isDamaged": false,
  "remarks": "Returned in good condition"
}
```

**Response:**
```json
{
  "success": true,
  "message": "3 kit(s) returned successfully",
  "data": { /* updated item */ }
}
```

---

### PUT /api/items/:id
Update kit details (Admin/Supervisor only)

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "quantity": 60,
  "unitPrice": 2700,
  "reorderLevel": 15
}
```

**Response:**
```json
{
  "success": true,
  "message": "Item updated successfully",
  "data": { /* updated item */ }
}
```

---

### DELETE /api/items/:id
Delete kit (Admin only)

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Item deleted successfully",
  "data": { /* deleted item */ }
}
```

---

## 📊 Analytics Endpoints (Supervisor/Admin Only)

### GET /api/analytics/dashboard
Get complete analytics dashboard

**Headers:**
```
Authorization: Bearer <supervisor-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "inventoryAnalytics": { /* inventory stats */ },
    "reorderRecommendations": [ /* items to reorder */ ],
    "trendingItems": [ /* top trending items */ ],
    "demandPredictions": [ /* predicted demands */ ],
    "smartReminders": [ /* action items */ ],
    "timestamp": "2024-03-29T10:30:00Z"
  }
}
```

---

### GET /api/analytics/inventory
Get detailed inventory analytics

**Headers:**
```
Authorization: Bearer <supervisor-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalItems": 20,
    "totalQuantity": 500,
    "totalIssued": 45,
    "totalDamaged": 3,
    "totalLost": 2,
    "totalValue": 1250000,
    "averageStock": 225,
    "criticalItems": 2,
    "highUrgencyItems": 5,
    "categoryBreakdown": { /* by category */ }
  }
}
```

---

### GET /api/analytics/demand/current
Get current demand predictions for all items

**Headers:**
```
Authorization: Bearer <supervisor-token>
```

**Response:**
```json
{
  "success": true,
  "count": 15,
  "data": [
    {
      "id": "123",
      "name": "Cricket Bat",
      "category": "Cricket",
      "currentDemand": 8,
      "predictedDemand": 60,
      "urgency": "medium"
    }
  ]
}
```

---

### GET /api/analytics/demand/future
Get 3-6 month demand forecast

**Headers:**
```
Authorization: Bearer <supervisor-token>
```

**Query:**
- `months` - Number of months to forecast (default: 3)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "month": "Apr",
      "monthNumber": 4,
      "seasonMultiplier": 2.0,
      "estimatedDemand": 240,
      "criticalItems": 3
    }
  ]
}
```

---

### GET /api/analytics/trending
Get trending items (most issued)

**Headers:**
```
Authorization: Bearer <supervisor-token>
```

**Query:**
- `limit` - Number of items (default: 5)

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "123",
      "name": "Cricket Bat",
      "category": "Cricket",
      "issued": 125,
      "trendingScore": 95
    }
  ]
}
```

---

### GET /api/analytics/reorder/recommendations
Get reorder recommendations

**Headers:**
```
Authorization: Bearer <supervisor-token>
```

**Response:**
```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "id": "123",
      "name": "Cricket Bat",
      "category": "Cricket",
      "currentStock": 5,
      "reorderLevel": 10,
      "recommendedQuantity": 30,
      "urgency": "high",
      "supplier": "Sports Co"
    }
  ]
}
```

---

### GET /api/analytics/reminders
Get smart reminders for actions

**Headers:**
```
Authorization: Bearer <supervisor-token>
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "type": "high_issued",
      "message": "Cricket Bat has 85 units issued. Consider follow-up for returns.",
      "severity": "high",
      "itemId": "123",
      "itemName": "Cricket Bat"
    }
  ]
}
```

---

### GET /api/analytics/calendar
Get academic calendar and multipliers

**Headers:**
```
Authorization: Bearer <supervisor-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "seasonMultipliers": {
      "Jan-Feb": 1.8,
      "Mar-Apr": 2.0,
      "May-Jun": 2.2,
      "Jul-Aug": 1.5,
      "Sep-Oct": 2.3,
      "Nov-Dec": 1.9
    },
    "categoryBaseDemand": { /* category demands */ },
    "currentSeasonMultiplier": 2.0
  }
}
```

---

### GET /api/analytics/categories
Get category-wise statistics

**Headers:**
```
Authorization: Bearer <supervisor-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "Cricket": {
      "count": 5,
      "quantity": 100,
      "issued": 25,
      "value": 250000
    }
  }
}
```

---

### GET /api/analytics/report/export
Export complete analytics report

**Headers:**
```
Authorization: Bearer <supervisor-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "generatedAt": "2024-03-29T10:30:00Z",
    "period": "Current",
    "summary": { /* inventory summary */ },
    "reorderPriorities": [ /* reorder items */ ],
    "trendingItems": [ /* trending */ ],
    "actionItems": [ /* reminders */ ],
    "sixMonthForecast": [ /* 6-month predictions */ ]
  }
}
```

---

## 🔑 Authorization Levels

| Endpoint | User | Supervisor | Admin |
|----------|------|-----------|-------|
| GET /api/items | ✅ | ✅ | ✅ |
| POST /api/items | ❌ | ✅ | ✅ |
| PUT /api/items/:id | ❌ | ✅ | ✅ |
| DELETE /api/items/:id | ❌ | ❌ | ✅ |
| POST /api/items/:id/issue | ✅ | ✅ | ✅ |
| GET /api/analytics/* | ❌ | ✅ | ✅ |

---

## 📝 Sample Integration

### JavaScript/Frontend

```javascript
// Set token from login
const token = localStorage.getItem('token');

// Fetch all items with predictions
fetch('http://localhost:5000/api/items?withPredictions=true', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log(data.data))
.catch(err => console.error(err));

// Issue a kit
fetch('http://localhost:5000/api/items/ITEM_ID/issue', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    quantity: 5,
    studentId: 'STU001'
  })
})
.then(res => res.json())
.then(data => console.log('Kit issued:', data))
.catch(err => console.error(err));

// Upload image
const formData = new FormData();
formData.append('image', fileInput.files[0]);

fetch('http://localhost:5000/api/items/ITEM_ID/upload-image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
.then(res => res.json())
.then(data => console.log('Image uploaded:', data))
.catch(err => console.error(err));
```

---

## 🚀 Installation & Setup

```bash
# Install dependencies
npm install

# Configure .env
cp .env.example .env
# Edit MONGODB_URI, JWT_SECRET, etc.

# Start server
npm run dev

# Server runs on http://localhost:5000
```

---

## ⚠️ Error Handling

All endpoints return error responses in this format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [ /* validation errors if any */ ]
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

---

## 🔒 Security Notes

1. Always send token in `Authorization: Bearer <token>` header
2. Tokens expire based on `JWT_EXPIRE` in .env (default: 7d)
3. Passwords are hashed with bcryptjs (10 salt rounds)
4. Image uploads support only JPEG, PNG, WEBP, GIF (max 5MB)
5. Admin operations require explicit admin role

---

## 📱 Role Permissions

**User Role:**
- View items and analytics (limited)
- Issue/return kits
- Update own profile

**Supervisor Role:**
- All User permissions
- View complete analytics
- Create/update items
- Manage reorder priorities

**Admin Role:**
- All permissions
- Delete items
- Manage users
- System administration

---

**Last Updated:** March 2024
**API Version:** 1.0.0 Advanced
