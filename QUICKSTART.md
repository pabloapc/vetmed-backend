# Quick Start Guide - Gimed Backend

Get the Gimed backend API up and running in minutes!

## Prerequisites

- Node.js v14+ installed
- MongoDB installed locally OR Docker installed

## Option 1: Quick Start with Docker (Recommended)

The easiest way to get started is using Docker Compose, which sets up both MongoDB and the API:

```bash
# 1. Clone and navigate to the repository
cd gimed-backend

# 2. Copy environment file
cp .env.example .env

# 3. Start everything with Docker Compose
docker-compose up
```

The API will be available at `http://localhost:3000`

## Option 2: Manual Setup (Local Development)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
# Minimum required:
# - MONGODB_URI=mongodb://localhost:27017/gimed
# - JWT_SECRET=your_secret_key_here
```

### Step 3: Start MongoDB

Make sure MongoDB is running locally:

```bash
# On Linux/macOS
mongod

# Or if using MongoDB as a service
sudo systemctl start mongod
```

### Step 4: (Optional) Seed Sample Data

Add sample veterinarias to the database:

```bash
npm run seed
```

### Step 5: Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Or production mode
npm start
```

The API will be available at `http://localhost:3000`

## Testing the API

### 1. Check if the API is running

Open your browser or use curl:
```bash
curl http://localhost:3000
```

You should see a welcome message.

### 2. Register a new user

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "password": "password123",
    "latitude": 40.7128,
    "longitude": -74.0060
  }'
```

### 3. Verify email

In development mode, check your console for the verification link. Copy the token and verify:

```bash
curl http://localhost:3000/api/auth/verify-email/{TOKEN_HERE}
```

Save the JWT token from the response.

### 4. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "password": "password123"
  }'
```

Save the JWT token from the response.

### 5. Get nearby pharmacies

```bash
curl http://localhost:3000/api/pharmacies/nearby \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## Using Postman

For a better testing experience, import the Postman collection:

1. Open Postman
2. Click "Import"
3. Copy the JSON from `POSTMAN_EXAMPLES.md`
4. Paste into "Raw text" tab
5. Set the `baseUrl` variable to `http://localhost:3000/api`
6. Start testing!

## Project Structure

```
src/
├── config/          # Database configuration
├── controllers/     # Request handlers
├── middleware/      # Express middleware (auth, validation, rate limiting)
├── models/          # Mongoose models
├── routes/          # API routes
├── utils/           # Utility functions (email, JWT)
└── index.js         # Application entry point
```

## Available Scripts

- `npm start` - Start the server in production mode
- `npm run dev` - Start the server with hot reload (nodemon)
- `npm run seed` - Populate database with sample pharmacies
- `npm test` - Run tests (to be implemented)

## API Endpoints

### Authentication (Public)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/verify-email/:token` - Verify email

### User (Protected)
- `GET /api/auth/me` - Get current user profile

### Pharmacies (Protected)
- `GET /api/pharmacies` - List all pharmacies
- `GET /api/pharmacies/nearby` - Get pharmacies near user
- `GET /api/pharmacies/:id` - Get single pharmacy details

All protected routes require the `Authorization: Bearer {token}` header.

## Development Tips

### Hot Reload

The development server uses nodemon for hot reloading. Just save your changes and the server will automatically restart.

### Email Testing

In development mode (without Resend API key), verification emails are logged to the console. Look for:
```
=== EMAIL VERIFICATION ===
To: user@example.com
Verification URL: http://localhost:3000/verify-email/...
=========================
```

### MongoDB GUI

For easier database management, consider using:
- MongoDB Compass (official GUI)
- Studio 3T
- Robo 3T

### Debugging

Add `console.log()` statements or use Node.js built-in debugger:
```bash
node --inspect src/index.js
```

Then connect with Chrome DevTools at `chrome://inspect`

## Common Issues

### Port Already in Use
```bash
# Error: EADDRINUSE
# Solution: Change PORT in .env or kill the process using port 3000
lsof -ti:3000 | xargs kill -9
```

### MongoDB Connection Failed
```bash
# Make sure MongoDB is running
sudo systemctl status mongod
# or
ps aux | grep mongod
```

### Node Modules Issues
```bash
# Delete and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

1. ✅ API is running
2. 📝 Read the full [API Documentation](README.md)
3. 🔐 Review [Security measures](SECURITY.md)
4. 🧪 Use [Postman examples](POSTMAN_EXAMPLES.md) for testing
5. 🚀 Deploy to production (see README.md)

## Need Help?

- Check the [README.md](README.md) for detailed documentation
- Review [POSTMAN_EXAMPLES.md](POSTMAN_EXAMPLES.md) for API usage examples
- Open an issue on GitHub for bugs or questions

---

**Happy coding! 🎉**
