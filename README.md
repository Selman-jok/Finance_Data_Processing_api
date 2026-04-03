# Finance Data Processing and Access Control Backend

A backend API for managing financial records, user roles, access permissions, and dashboard analytics.

This project was built as part of a **Backend Developer Intern assessment** to demonstrate backend architecture, API design, authentication, authorization, validation, and business logic implementation.

---

## Features

- JWT Authentication
- Role-Based Access Control (RBAC)
- User Management
- Financial Record Management
- Dashboard Analytics
- Filtering, Search, and Pagination
- Input Validation and Error Handling

---

## Roles and Permissions

### Admin
- Manage users
- Create, update, and delete financial records
- Access all dashboard analytics

### Analyst
- View financial records
- Filter and search records
- Access dashboard analytics

### Viewer
- View dashboard summary and insights only

---

## Tech Stack

- **Node.js**
- **Express.js**
- **MongoDB**
- **Mongoose**
- **JWT (jsonwebtoken)**
- **bcryptjs**
- **dotenv**
- **cors**
- **nodemon**

---

## Project Structure

```bash
Finance_DATA_PROCESSING_API/
├── src/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── recordController.js
│   │   └── dashboardController.js
│   ├── middlewares/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   └── FinancialRecord.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── recordRoutes.js
│   │   └── dashboardRoutes.js
│   └── tests/
│       ├── seedAdmin.js
│       └── testLogin.js
├── .env
├── .gitignore
├── package.json
└── server.js
```

---

## Installation and Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd Finance_DATA_PROCESSING_API
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root folder:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/finance_db
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
```

> Replace `MONGODB_URI` with your own MongoDB connection string and finally add name of your database name like /finance_db this is mine .

### 4. Start MongoDB

If using local MongoDB on Windows:

```bash
net start MongoDB
```

If using **MongoDB Atlas**, use your Atlas connection string in `.env`.

### 5. Run the Project

#### Development

```bash
npm run dev
```

#### Production

```bash
npm start
```

Server runs on:

```txt
http://localhost:5000
```
### 6. Seed(create) the Initial Admin User once 

```bash
node src/tests/seedAdmin.js
```

**Default Admin Credentials**

```txt
Email: admin@finance.com
Password: Admin123!
```
---

## Authentication Flow

This system does **not support public registration**.

### User Creation Flow
1. Seed the initial **Admin**
2. Admin logs in
3. Admin creates other users
4. Created users can log in based on their assigned role

This reflects a realistic **internal finance management system**.

---

## Business Rules

- Public signup is **not allowed**
- Only **Admin** can create, update, or delete financial records
- **Analyst** can only view and analyze records
- **Viewer** can only access dashboard-level insights
- Users can update only their own:
  - `name`
  - `password`
- Only **Admin** can manage:
  - `role`
  - `status`
  - `email`

---

## Validation and Error Handling

The API includes:

- Required field validation
- Enum validation (`role`, `status`, `type`)
- Proper HTTP status codes
- Meaningful error messages
- Unauthorized access protection

---

## API Base URL

```txt
http://localhost:5000/api
```

---

## Main API Modules

 Testing Examples
 
Step 1: Login as Admin

http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
    "email": "admin@finance.com",
    "password": "Admin123!"
}
Response: Save the token from response for subsequent requests.

Step 2: Admin Creates Records

http
POST http://localhost:5000/api/records
Authorization: Bearer {admin_token}
Content-Type: application/json

{
    "amount": 5000,
    "type": "income",
    "category": "Salary",
    "date": "2026-04-01",
    "notes": "Monthly salary",
    "description": "April 2026 salary"
}

Step 3: Admin Creates Multiple Records

http
POST http://localhost:5000/api/records
Authorization: Bearer {admin_token}
Content-Type: application/json

{
    "amount": 1500,
    "type": "expense",
    "category": "Rent",
    "date": "2026-04-02",
    "notes": "Monthly rent",
    "description": "Apartment rent"
}
http
POST http://localhost:5000/api/records
Authorization: Bearer {admin_token}
Content-Type: application/json

{
    "amount": 300,
    "type": "expense",
    "category": "Food",
    "date": "2026-04-03",
    "notes": "Groceries",
    "description": "Weekly groceries"
}

Step 4: Analyst Views Records

Login as Analyst first:

http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
    "email": "analyst@example.com",
    "password": "password123"
}
Then view records:

http
GET http://localhost:5000/api/records
Authorization: Bearer {analyst_token}

Step 5: Test All Filter Combinations

http
# Get all records
GET http://localhost:5000/api/records
Authorization: Bearer {token}

# Get recored by ID
http://localhost:5000/api/records/69ce5a7aac2a1159769d22ae

# Get all records by pagination
http://localhost:5000/api/records?page=1&limit=5
Authorization: Bearer {token}

# Get records by type (income)
GET http://localhost:5000/api/records?type=income
Authorization: Bearer {token}

# Get records by category
GET http://localhost:5000/api/records?category=Salary
Authorization: Bearer {token}

# Get records by date range
GET http://localhost:5000/api/records?startDate=2026-04-01&endDate=2026-04-30
Authorization: Bearer {token}

# Search records
GET http://localhost:5000/api/records?search=salary
Authorization: Bearer {token}

# Combined filters with pagination
GET http://localhost:5000/api/records?type=expense&category=Food&startDate=2026-04-01&endDate=2026-04-30&page=1&limit=10
Authorization: Bearer {token}

Step 6: Admin Updates a Record
http
PUT http://localhost:5000/api/records/{record_id}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
    "amount": 5500,
    "notes": "Updated salary amount"
}

Step 7: Admin Soft Deletes a Record
http

DELETE http://localhost:5000/api/records/{record_id}
Authorization: Bearer {admin_token}

Step 8: Admin Permanently Deletes a Record

http
DELETE http://localhost:5000/api/records/{record_id}/permanent
Authorization: Bearer {admin_token}

Step 9: Dashboard Endpoints for All Users

http
# Get summary totals
GET http://localhost:5000/api/dashboard/summary
Authorization: Bearer {token}

# Get summary with date range
GET http://localhost:5000/api/dashboard/summary?startDate=2026-04-01&endDate=2026-04-30
Authorization: Bearer {token}

# Get category summary
GET http://localhost:5000/api/dashboard/category-summary
Authorization: Bearer {token}

# Get 6-month trends
GET http://localhost:5000/api/dashboard/trends?months=6
Authorization: Bearer {token}

# Get recent activity (last 10 records)
GET http://localhost:5000/api/dashboard/recent-activity?limit=10
Authorization: Bearer {token}

Step 10: User Profile Management

http
# Get my profile
GET http://localhost:5000/api/users/me
Authorization: Bearer {token}

# Update my profile (only name and password)

PUT http://localhost:5000/api/users/me
Authorization: Bearer {token}
Content-Type: application/json

{
    "name": "Updated Name",
    "password": "newpassword123"
}

Step 11: Admin User Management

http
# Create new user
POST http://localhost:5000/api/users
Authorization: Bearer {admin_token}
Content-Type: application/json

{
    "name": "New Analyst",
    "email": "analyst@example.com",
    "password": "password123",
    "role": "analyst",
    "status": "active"
}

# Get all users 
GET  http://localhost:5000/api/users
# Get  users by id
http://localhost:5000/api/users/{userid}
# Get users by role
GET http://localhost:5000/api/users?role=analyst
Authorization: Bearer {admin_token}

# Get users by status
GET http://localhost:5000/api/users?status=active
Authorization: Bearer {admin_token}

# Search users by name
GET http://localhost:5000/api/users?search=john
Authorization: Bearer {admin_token}

# Update user status (activate/deactivate)
PATCH http://localhost:5000/api/users/{user_id}/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
    "status": "inactive"
}

# Delete user
DELETE http://localhost:5000/api/users/{user_id}
Authorization: Bearer {admin_token}


Role-Based Access Summary Endpoint 
Admin:can you full access
Analyst: can see Dashboard summary ,view recoreds , updated own profile but restrictive( only name , password but not  role , status , email ) , see his own profile 
viewer: see dashboard summary data , can see own profile and updated own profile but restrictive( only name , password but not  role , status , email )

Expected Response Formats
Success Response
json
{
    "success": true,
    "message": "Operation successful",
    "data": { ... }
}
Error Response
json
{
    "success": false,
    "error": "Error message description"
}
Pagination Response
json
{
    "success": true,
    "count": 10,
    "total": 50,
    "pagination": {
        "page": 1,
        "limit": 10,
        "total": 50,
        "pages": 5,
        "hasNext": true,
        "hasPrev": false
    },
    "data": [ ... ]
}

## Assumptions Made

- This is an **internal finance dashboard**
- Financial records are managed only by **Admin**
- Analysts are intended for **data analysis**, not modification
- Viewers are intended for **read-only visibility**

---

## Author

**Selman Mulugeta**
