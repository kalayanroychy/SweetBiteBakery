# 🍰 SweetBite Bakery - Setup Guide

A comprehensive guide to clone and run the SweetBite Bakery project on your local machine.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download here](https://git-scm.com/)
- **PostgreSQL Database** (optional - for production mode)

## 🚀 Quick Start

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone <your-repository-url> SweetBiteBakery

# Navigate to the project directory
cd SweetBiteBakery
```

### Step 2: Install Dependencies

```bash
# Install all project dependencies
npm install
```

This will install all required packages including:
- Express.js (backend server)
- React (frontend)
- Drizzle ORM (database)
- TypeScript
- And other dependencies

### Step 3: Environment Configuration

The project can run in two modes:

#### Option A: In-Memory Mode (Quick Start - No Database Required)

Simply skip the `.env` file creation. The project will automatically use in-memory storage.

```bash
# No .env file needed - just run the project!
npm run dev
```

> ⚠️ **Note**: Data will not persist between server restarts in this mode.

#### Option B: Database Mode (Persistent Storage)

Create a `.env` file in the root directory:

```bash
# Create .env file
touch .env
```

Add your database connection string:

```env
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
```

**Example with Neon Database:**
```env
DATABASE_URL=postgresql://user:pass@ep-example-123.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Step 4: Run Database Migrations (Database Mode Only)

If you're using a database, run the migrations:

```bash
npm run db:push
```

This will create all necessary tables in your database.

### Step 5: Start the Development Server

```bash
npm run dev
```

The application will start on:
- **Frontend**: http://localhost:5000
- **Backend API**: http://localhost:5000/api

## 📁 Project Structure

```
SweetBiteBakery/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities and helpers
│   │   └── main.tsx       # Entry point
│   └── index.html
├── server/                # Backend Express application
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   ├── db.ts             # Database configuration
│   ├── database.ts       # Database operations
│   ├── storage.ts        # Storage interface
│   └── loadInitialData.ts # Seed data
├── shared/               # Shared types and schemas
│   └── schema.ts         # Database schema
├── .env                  # Environment variables (create this)
└── package.json          # Project dependencies
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:push` | Push database schema changes |
| `npm run db:studio` | Open Drizzle Studio (database GUI) |

## 🌐 Accessing the Application

Once the server is running:

1. **Home Page**: http://localhost:5000
2. **Products**: http://localhost:5000/products
3. **Admin Login**: http://localhost:5000/admin/login
   - Default credentials (in-memory mode):
     - Username: `admin`
     - Password: `admin123`

## 🗄️ Database Options

### Option 1: Neon Database (Recommended - Free Tier Available)

1. Go to [Neon.tech](https://neon.tech/)
2. Sign up for a free account
3. Create a new project
4. Copy the connection string
5. Add it to your `.env` file

### Option 2: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a new database:
   ```sql
   CREATE DATABASE sweetbite_bakery;
   ```
3. Use connection string:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/sweetbite_bakery
   ```

### Option 3: Other PostgreSQL Providers

- [Supabase](https://supabase.com/)
- [Railway](https://railway.app/)
- [Render](https://render.com/)

## 🎨 Features

- ✅ Product catalog with categories
- ✅ Featured products showcase
- ✅ Shopping cart functionality
- ✅ User authentication
- ✅ Admin dashboard
- ✅ Order management
- ✅ Responsive design
- ✅ In-memory storage fallback

## 🐛 Troubleshooting

### Port Already in Use

If port 5000 is already in use:

```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5000 | xargs kill -9
```

### Database Connection Issues

1. Verify your `DATABASE_URL` is correct
2. Check if your database is accessible
3. Ensure SSL mode is set correctly
4. Try running without database (in-memory mode)

### Dependencies Installation Fails

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### TypeScript Errors

```bash
# Rebuild the project
npm run build
```

## 📦 Initial Data

The project automatically loads initial data on first run:

- **Categories**: Cakes, Pastries, Cookies, Breads
- **Sample Products**: Various bakery items
- **Admin User**: Default admin account

## 🔐 Security Notes

> ⚠️ **Important**: Change default admin credentials in production!

For production deployment:
1. Use strong passwords
2. Enable HTTPS
3. Set up proper environment variables
4. Use a production-grade database
5. Implement rate limiting
6. Add CORS configuration

## 📝 Next Steps

After setup:

1. Explore the admin dashboard
2. Add your own products
3. Customize categories
4. Update branding and styling
5. Configure payment integration (if needed)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 💬 Support

If you encounter any issues:

1. Check this guide thoroughly
2. Review the troubleshooting section
3. Check the console for error messages
4. Ensure all prerequisites are installed

---

**Happy Baking! 🍰**
