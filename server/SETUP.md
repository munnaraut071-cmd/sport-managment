# SETUP GUIDE - Sports Kits Management Backend

## ✅ Installation Steps

### Step 1: Ensure Node.js & npm are installed
```bash
node --version  # Should be v14+
npm --version
```

### Step 2: Navigate to backend directory
```bash
cd "Sports Kits Management System/sports-kit-backend"
```

### Step 3: Install all dependencies
```bash
npm install
```

This will install:
- express (web framework)
- mongoose (MongoDB driver)
- cors (cross-origin support)
- All other dependencies from package.json

### Step 4: Configure MongoDB

**Option A: Local MongoDB**
1. Download MongoDB Community Edition
2. Start MongoDB service: `mongod`
3. In `.env`, set: `MONGODB_URI=mongodb://localhost:27017/sports-kit-management`

**Option B: MongoDB Atlas (Cloud)**
1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. In `.env`, set: `MONGODB_URI=<your-atlas-connection-string>`

### Step 5: Configure Environment
```bash
# Edit .env file with:
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sports-kit-management
NODE_ENV=development
JWT_SECRET=your_secret_key_here
CLIENT_URL=http://localhost:3000
```

### Step 6: Start the server
```bash
npm run dev    # Development with auto-reload
# or
npm start      # Production mode
```

Expected output:
```
✅ Server running on port 5000
Environment: development
```

## 🧪 Testing the API

### Using cURL
```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Get all items
curl http://localhost:5000/api/items

# Create new item
curl -X POST http://localhost:5000/api/items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cricket Bat",
    "category": "Cricket",
    "quantity": 50,
    "unitPrice": 2500,
    "reorderLevel": 10,
    "supplier": "Sports Co"
  }'
```

### Using Postman
1. Download Postman: https://www.postman.com/downloads/
2. Create new collection "Sports Kits API"
3. Import sample requests from routes/itemRoutes.js documentation
4. Test each endpoint

## 📚 Sample Data

Insert sample items into MongoDB:

```javascript
// Connect to MongoDB
use sports-kit-management

// Insert items
db.items.insertMany([
  {
    name: "Cricket Bat",
    category: "Cricket",
    quantity: 50,
    unitPrice: 2500,
    reorderLevel: 10,
    baseDemand: 8,
    issued: 0,
    returned: 0,
    damaged: 0,
    lost: 0,
    supplier: "Sports Co",
    location: "Storage A",
    active: true
  },
  {
    name: "Football",
    category: "Football",
    quantity: 30,
    unitPrice: 1200,
    reorderLevel: 5,
    baseDemand: 6,
    issued: 0,
    returned: 0,
    damaged: 0,
    lost: 0,
    supplier: "Sports Co",
    location: "Storage B",
    active: true
  }
])
```

## 🔌 API Quick Reference

```
GET  /api/health                    # Server status
GET  /api/items                     # All items
GET  /api/items/:id                 # Single item
GET  /api/items/reorder/check       # Items needing reorder
GET  /api/items/summary/dashboard   # Dashboard summary
POST /api/items                     # Create item
POST /api/items/:id/issue           # Issue kit
POST /api/items/:id/return          # Return kit
PUT  /api/items/:id                 # Update item
DELETE /api/items/:id               # Delete item
```

## ⚙️ Frontend Integration

Connect frontend (index.js) to backend:

```javascript
const API_URL = 'http://localhost:5000/api';

// Example: Fetch all items
fetch(`${API_URL}/items`)
  .then(res => res.json())
  .then(data => console.log(data.data))
  .catch(err => console.error(err));

// Example: Issue a kit
fetch(`${API_URL}/items/ITEM_ID/issue`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    quantity: 5,
    studentId: 'STU001'
  })
})
.then(res => res.json())
.then(data => console.log('Kit issued:', data))
.catch(err => console.error(err));
```

## 🐛 Common Issues & Solutions

### "Cannot connect to MongoDB"
- Check MongoDB is running: `mongod`
- Verify MONGODB_URI in .env
- Check firewall/network settings

### "Port 5000 already in use"
- Change PORT in .env to 5001, 5002, etc.
- Or kill the process using the port

### "Module not found: express"
- Run: `npm install`
- Check package.json exists in directory

### "Connection refused"
- Ensure MongoDB service is active
- Check connection string format

## 📦 Deployed Endpoints (After Deployment)

Once deployed to production (Heroku, AWS, etc.):
- Replace `localhost:5000` with your production URL
- Update MONGODB_URI to production database
- Set NODE_ENV=production
- Use secure JWT_SECRET

## 🚀 Next Steps

1. ✅ Backend setup complete
2. Connect frontend to backend API
3. Test all CRUD operations
4. Add user authentication (auth routes)
5. Deploy backend to production
6. Set up CI/CD pipeline

## 📞 Support

For issues or questions:
- Check error messages in terminal
- Review MongoDB logs
- Consult Express.js documentation
- Check Mongoose documentation

---
**Setup Date:** 2024
**Backend Version:** 1.0.0
