# Sports Kits Management System - Backend API

Complete Node.js/Express backend for sports kits inventory management with AI-powered demand forecasting.

## 📋 Prerequisites

- **Node.js** v14+ 
- **npm** or **yarn**
- **MongoDB** v4.4+ (local or cloud instance)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env` and update with your settings:

```bash
cp .env.example .env
```

**Key Variables:**
- `MONGODB_URI`: Your MongoDB connection string
- `PORT`: Server port (default: 5000)
- `JWT_SECRET`: Secret key for JWT tokens
- `NODE_ENV`: Set to `development` or `production`

### 3. Start Server

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server will start on `http://localhost:5000`

## 📁 Project Structure

```
sports-kit-backend/
├── server.js                 # Express app entry point
├── package.json              # Dependencies & scripts
├── .env                      # Environment variables
├── .env.example              # Environment template
├── config/
│   └── db.js                # MongoDB connection
├── models/
│   └── Item.js              # Sports kit schema
├── routes/
│   └── itemRoutes.js        # CRUD API endpoints
└── README.md                # This file
```

## 🔌 API Endpoints

### GET /api/health
Check server status

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### Items Management

#### GET /api/items
Get all sports kits (with optional filters)

**Query Parameters:**
- `category`: Filter by category (Cricket, Football, etc.)
- `active`: Filter by active status (true/false)

**Response:**
```json
{
  "success": true,
  "count": 15,
  "data": [
    {
      "_id": "ObjectId",
      "name": "Cricket Bat",
      "category": "Cricket",
      "quantity": 50,
      "issued": 5,
      "available": 45,
      "unitPrice": 2500,
      "aiPredictedDemand": 60,
      "reorderLevel": 10,
      "needsReorder": false
    }
  ]
}
```

---

#### GET /api/items/:id
Get single item by ID

**Parameters:**
- `id`: Item MongoDB ID

**Response:**
```json
{
  "success": true,
  "data": { /* item object */ }
}
```

---

#### GET /api/items/reorder/check
Get items needing reorder

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [ /* reorder items */ ]
}
```

---

#### GET /api/items/summary/dashboard
Get inventory dashboard summary

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
    "reorderNeeded": 4,
    "categories": {
      "Cricket": { "count": 5, "quantity": 100, "issued": 10 },
      "Football": { "count": 3, "quantity": 75, "issued": 8 }
    }
  }
}
```

---

#### POST /api/items
Create new sports kit

**Body:**
```json
{
  "name": "Cricket Bat",
  "category": "Cricket",
  "description": "Premium wooden cricket bat",
  "quantity": 50,
  "unitPrice": 2500,
  "reorderLevel": 10,
  "supplier": "Supplier Name",
  "location": "Storage A"
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

#### POST /api/items/:id/issue
Issue kit to student/team

**Body:**
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

#### POST /api/items/:id/return
Return kit (with optional damage tracking)

**Body:**
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

#### PUT /api/items/:id
Update item details

**Body:**
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

#### DELETE /api/items/:id
Delete item from inventory

**Response:**
```json
{
  "success": true,
  "message": "Item deleted successfully",
  "data": { /* deleted item */ }
}
```

---

## 🗂️ Item Schema Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Kit name (required) |
| `category` | String | Category enum (Cricket, Football, etc.) |
| `description` | String | Brief description |
| `quantity` | Number | Current stock quantity |
| `issued` | Number | Units currently issued |
| `returned` | Number | Total returned units |
| `damaged` | Number | Damaged units |
| `lost` | Number | Lost units |
| `unitPrice` | Number | Price per unit |
| `baseDemand` | Number | AI baseline demand |
| `aiPredictedDemand` | Number | AI forecasted demand |
| `reorderLevel` | Number | Threshold for reorder alerts |
| `supplier` | String | Supplier name |
| `location` | String | Storage location |
| `imageUrl` | String | Kit image URL |
| `tags` | Array | Search tags |
| `active` | Boolean | Active status |

## 📊 AI Prediction Integration

The backend supports frontend AI predictions by:

1. **Storing base demand**: `baseDemand` field tracks historical average
2. **Updating predictions**: Frontend calculates and backend stores in `aiPredictedDemand`
3. **Tracking patterns**: `issued`, `returned` fields enable trend analysis
4. **Reorder automation**: `needsReorder()` method checks against thresholds

## 🔐 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5000 | Server port |
| `NODE_ENV` | development | Environment mode |
| `MONGODB_URI` | localhost:27017 | MongoDB connection |
| `JWT_SECRET` | (required) | JWT token secret |
| `CLIENT_URL` | localhost:3000 | Frontend URL for CORS |

## 📦 Dependencies

- **express**: Web framework
- **mongoose**: MongoDB ODM
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variables
- **express-validator**: Input validation
- **bcryptjs**: Password hashing (ready for auth)
- **jsonwebtoken**: JWT authentication (ready for auth)
- **axios**: HTTP requests
- **nodemon**: Auto-reload (dev only)

## 🐛 Troubleshooting

**MongoDB Connection Failed:**
```
Check MONGODB_URI in .env file
Ensure MongoDB server is running: mongod
```

**Port Already in Use:**
```
Change PORT in .env or kill process: lsof -i :5000
```

**Validation Errors:**
```
Check request body format matches Item schema
Review error messages in response
```

## 📈 Future Enhancements

- [ ] User authentication & roles
- [ ] Transaction history & audit logs
- [ ] Advanced analytics endpoints
- [ ] File uploads for kit images
- [ ] Notification system
- [ ] Batch operations

## 🤝 Contributing

Guidelines for future contributions:
1. Follow existing code structure
2. Add input validation for all endpoints
3. Include error handling
4. Document new routes in README
5. Test with sample data

## 📝 License

Sports Kits Management System - Backend API v1.0
