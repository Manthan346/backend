# Student Performance Dashboard API

A comprehensive REST API for tracking and managing student performance, built with Express.js and MongoDB.

## Features

- **Authentication & Authorization** - JWT-based auth with role-based access control
- **Student Management** - CRUD operations for student records
- **Test Management** - Create, update, and manage tests/exams
- **Performance Tracking** - Record and track student marks and grades
- **Dashboard Analytics** - Rich dashboard data with performance insights
- **Admin Panel** - Admin-only features for user and subject management

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)

### Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Environment setup:**
Create a `.env` file with:
```env
MONGO_URI=mongodb://localhost:27017/student_dashboard
JWT_SECRET=your_super_secret_jwt_key
PORT=5000
ADMIN_EMAIL=admin@school.com
ADMIN_PASSWORD=admin123
```

3. **Start the server:**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/change-password` - Change password

### Students
- `GET /api/students` - Get all students (Admin)
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create student (Admin)
- `PUT /api/students/:id` - Update student (Admin)
- `DELETE /api/students/:id` - Delete student (Admin)
- `GET /api/students/:id/performance` - Get student performance

### Tests
- `GET /api/tests` - Get all tests
- `GET /api/tests/:id` - Get test by ID
- `POST /api/tests` - Create test (Admin)
- `PUT /api/tests/:id` - Update test (Admin)
- `DELETE /api/tests/:id` - Delete test (Admin)
- `POST /api/tests/:id/marks` - Submit marks (Admin)
- `GET /api/tests/:id/results` - Get test results

### Dashboard
- `GET /api/dashboard/student/:id` - Get student dashboard data
- `GET /api/dashboard/class?class=10A` - Get class performance (Admin)
- `GET /api/dashboard/stats` - Get overall stats (Admin)

### Admin
- `POST /api/admin/create-user` - Create admin/teacher user
- `GET /api/admin/users` - Get all users
- `POST /api/admin/subjects` - Create subject
- `GET /api/admin/subjects` - Get all subjects
- `PUT /api/admin/subjects/:id` - Update subject
- `DELETE /api/admin/subjects/:id` - Delete subject

## File Structure

```
├── server.js                 # Main server file
├── config/
│   ├── database.js          # MongoDB connection
│   └── config.js            # App configuration
├── models/
│   ├── Student.js           # Student schema
│   ├── Test.js              # Test schema
│   ├── Subject.js           # Subject schema
│   ├── User.js              # User schema
│   └── Performance.js       # Performance schema
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── studentController.js # Student operations
│   ├── testController.js    # Test operations
│   └── dashboardController.js # Dashboard logic
├── routes/
│   ├── auth.js              # Auth routes
│   ├── students.js          # Student routes
│   ├── tests.js             # Test routes
│   ├── dashboard.js         # Dashboard routes
│   └── admin.js             # Admin routes
├── middleware/
│   ├── auth.js              # Authentication middleware
│   └── admin.js             # Admin authorization
└── utils/
    └── helpers.js           # Utility functions
```

## Usage Examples

### Create a Student
```bash
curl -X POST http://localhost:5000/api/students \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "rollNo": "2023001",
    "class": "10A"
  }'
```

### Submit Test Marks
```bash
curl -X POST http://localhost:5000/api/tests/TEST_ID/marks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
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

### Get Student Dashboard
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5000/api/dashboard/student/STUDENT_ID
```

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (Admin/Teacher/Student)
- Input validation and sanitization
- MongoDB injection protection

## Error Handling

The API returns consistent error responses:
```json
{
  "message": "Error description",
  "errors": ["Detailed error messages"]
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test your changes
5. Submit a pull request

## License

MIT License - feel free to use this project for educational purposes.