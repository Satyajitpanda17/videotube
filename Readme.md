# Backend

A Backend project to improve my skills in backend developement and do my deep dive in it.

# Resources used and why ?
Learning backend development with Node.js, Express.js, MongoDB, and Cloudinary empowers you to build scalable web applications, manage data efficiently, and optimize media delivery for enhanced user experiences.

# Link for the models of the project
[Model Link](https://app.eraser.io/workspace/YtPqZ1VogxGy1jzIDkzj)

# API Documentation

## 🔐 Authentication API

### `POST /api/v1/users/register`
Registers a new user.

**Form Data (multipart/form-data):**
- `fullName`: string *(required)*
- `username`: string *(required)*
- `email`: string *(required)*
- `password`: string *(required)*
- `avatar`: file *(required)*
- `coverImage`: file *(optional)*

**Response:**
```json
{
  "success": true,
  "data": { /* user object */ },
  "message": "User registered successfully"
}
