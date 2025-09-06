# Placement Readiness System - Backend

A comprehensive backend API for a placement readiness management system built with Express.js, MongoDB, and JWT authentication. This backend is specifically designed to match your React frontend requirements.

## 🚀 Features

- **Complete User Management**: Admin, Teacher, and Student roles with proper authentication
- **Subject Management**: Admin can create subjects, teachers are assigned to subjects
- **Test Management**: Teachers can create tests, manage results, and track student performance  
- **Marks Entry System**: Bulk marks entry with automatic grade calculation
- **Dashboard Analytics**: Role-based dashboards with relevant statistics
- **Secure Authentication**: JWT-based authentication with role-based access control

## 🏗️ Architecture

### Frontend-Backend Mapping
This backend perfectly matches your React frontend's API expectations:

| Frontend Component | API Endpoint | Description |
|-------------------|--------------|-------------|
| `TeacherManagement.jsx` | `GET /api/admin/teachers` | List all teachers |
| `SubjectManagement.jsx` | `GET /api/admin/subjects` | List all subjects |
| `TestPage.jsx` | `GET /api/tests` | List all tests |
| `MarksEntryModal.jsx` | `GET /api/students` | List all students |
| `MarksEntryModal.jsx` | `POST /api/tests/:id/marks` | Submit test marks |
| Login/Auth | `POST /api/auth/login` | User authentication |

### User Roles & Permissions

| Feature | Admin | Teacher | Student |
|---------|-------|---------|---------|
| Create Subjects | ✅ | ❌ | ❌ |
| Create Teachers | ✅ | ❌ | ❌ |
| Create Tests | ✅ | ✅ (assigned subjects) | ❌ |
| Enter Marks | ✅ | ✅ (own tests) | ❌ |
| View All Data | ✅ | ✅ (assigned subjects) | ✅ (own results) |

## 📁 Project Structure

```
placement-backend/
├── controllers/          # Business logic
│   ├── authController.js      # Authentication & user management
│   ├── adminController.js     # Admin operations
│   ├── testController.js      # Test management
│   └── studentController.js   # Student operations
├── middleware/           # Authentication & validation
│   ├── auth.js               # JWT authentication
│   └── validation.js         # Input validation
├── models/              # MongoDB schemas
│   ├── User.js              # User model (Admin/Teacher/Student)
│   ├── Subject.js           # Subject model
│   ├── Test.js              # Test model
│   └── TestResult.js        # Test results with auto-grading
├── routes/              # API endpoints
│   ├── auth.js              # Authentication routes
│   ├── admin.js             # Admin management routes
│   ├── tests.js             # Test management routes
│   ├── students.js          # Student routes
│   ├── subjects.js          # Subject routes
│   └── teachers.js          # Teacher routes
├── utils/
│   └── createAdmin.js       # Auto-create admin utility
├── config/
│   └── database.js          # Database configuration
├── server.js            # Main application file
├── package.json
├── .env                 # Environment variables
└── README.md
```

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/placement_system
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_complex_min_32_chars
JWT_EXPIRE=7d
ADMIN_EMAIL=admin@placement.com
ADMIN_PASSWORD=admin123
FRONTEND_URL=http://localhost:5173
```

### 3. Database Setup
- Make sure MongoDB is running
- The application will automatically create the database and collections
- Initial admin user will be created automatically

### 4. Start the Server
```bash
# Development
npm run dev

# Production
npm start
```

### 5. Initial Admin Access
- **Email**: `admin@placement.com`
- **Password**: `admin123`

## 📚 API Endpoints

### Authentication
```bash
POST /api/auth/login          # User login
POST /api/auth/register       # Student registration
GET  /api/auth/profile        # Get user profile
PUT  /api/auth/profile        # Update user profile
```

### Admin Routes (Admin Only)
```bash
GET  /api/admin/users         # Get all users
GET  /api/admin/teachers      # Get all teachers (TeacherManagement.jsx)
GET  /api/admin/subjects      # Get all subjects (SubjectManagement.jsx)
POST /api/admin/teachers      # Create teacher
POST /api/admin/subjects      # Create subject
PUT  /api/admin/users/:id     # Update user
DELETE /api/admin/users/:id   # Delete user
GET  /api/admin/dashboard     # Admin dashboard stats
```

### Test Management
```bash
GET  /api/tests               # Get all tests (TestPage.jsx)
GET  /api/tests/:id           # Get test by ID
POST /api/tests               # Create test (Teacher/Admin)
PUT  /api/tests/:id           # Update test (Teacher/Admin)
DELETE /api/tests/:id         # Delete test (Teacher/Admin)
GET  /api/tests/:id/results   # Get test results
POST /api/tests/:id/marks     # Submit marks (MarksEntryModal.jsx)
```

### Student Routes
```bash
GET  /api/students            # Get all students (MarksEntryModal.jsx)
GET  /api/students/dashboard  # Student dashboard
GET  /api/students/results    # Student's test results
GET  /api/students/:id/performance # Student performance (Teacher/Admin)
```

### Subject & Teacher Routes
```bash
GET  /api/subjects            # Get all subjects
GET  /api/subjects/:id        # Get subject by ID
GET  /api/teachers/dashboard  # Teacher dashboard
GET  /api/teachers            # Get all teachers (Admin only)
```

## 🗄️ Database Models

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: ['admin', 'teacher', 'student'],
  // Student fields
  rollNumber: String,
  department: String,
  year: Number,
  // Teacher fields
  employeeId: String,
  subjects: [ObjectId], // References to Subject
  // Common
  phone: String,
  address: String,
  isActive: Boolean
}
```

### Subject Model
```javascript
{
  name: String,
  code: String (unique),
  description: String,
  department: String,
  credits: Number,
  teachers: [ObjectId], // References to User
  createdBy: ObjectId,
  isActive: Boolean
}
```

### Test Model
```javascript
{
  title: String,
  subject: ObjectId, // Reference to Subject
  testType: ['quiz', 'midterm', 'final', 'assignment'],
  maxMarks: Number,
  passingMarks: Number,
  testDate: Date,
  duration: Number, // minutes
  description: String,
  createdBy: ObjectId,
  isActive: Boolean
}
```

### TestResult Model
```javascript
{
  test: ObjectId, // Reference to Test
  student: ObjectId, // Reference to User
  marksObtained: Number,
  percentage: Number, // Auto-calculated
  grade: String, // Auto-calculated (A+, A, B+, etc.)
  isPassed: Boolean, // Auto-calculated
  remarks: String,
  gradedBy: ObjectId,
  gradedAt: Date
}
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for secure password storage
- **Role-based Access Control**: Different permissions for each role
- **Input Validation**: express-validator for request validation
- **CORS Configuration**: Configured for your React frontend
- **Error Handling**: Comprehensive error handling middleware

## 🧪 Testing API

### Login Example
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@placement.com", "password": "admin123"}'
```

### Create Subject (Admin only)
```bash
curl -X POST http://localhost:5000/api/admin/subjects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Mathematics",
    "code": "MATH101",
    "department": "Engineering",
    "credits": 4
  }'
```

### Submit Test Marks
```bash
curl -X POST http://localhost:5000/api/tests/TEST_ID/marks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "marks": [
      {
        "studentId": "STUDENT_ID",
        "marksObtained": 85,
        "remarks": "Good performance"
      }
    ]
  }'
```

## 🔧 Development

### Run with Nodemon
```bash
npm run dev
```

### MongoDB Connection
The app connects to MongoDB using the URI from environment variables. Make sure MongoDB is running locally or provide a cloud MongoDB URI.

### Automatic Admin Creation
On first startup, the system automatically creates an admin user with credentials from the `.env` file.

### Error Handling
Comprehensive error handling for:
- Validation errors
- Authentication errors  
- Database errors
- Generic server errors

## 🚀 Production Deployment

1. Set `NODE_ENV=production`
2. Use a secure JWT_SECRET (minimum 32 characters)
3. Configure MongoDB URI for production
4. Set up proper CORS for your frontend domain
5. Use PM2 or similar for process management

## 📝 Frontend Integration

This backend is specifically designed to work with your React frontend:

1. **Authentication**: Matches your localStorage token storage pattern
2. **API Calls**: All endpoints match your frontend's API calls
3. **Data Structure**: Response formats match your frontend components
4. **Role-based Access**: Supports your frontend's role-based routing

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.
