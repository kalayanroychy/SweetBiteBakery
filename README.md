# 🍰 SweetBite Bakery

A modern, full-stack bakery e-commerce application built with React, Express, and TypeScript.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)

## ✨ Features

- 🛍️ **Product Catalog** - Browse bakery items by category
- 🎯 **Featured Products** - Showcase bestsellers and new items
- 🛒 **Shopping Cart** - Add items and manage orders
- 👤 **User Authentication** - Secure login and registration
- 🔐 **Admin Dashboard** - Manage products, categories, and orders
- 📱 **Responsive Design** - Works on all devices
- 💾 **Flexible Storage** - In-memory or PostgreSQL database

## 🚀 Quick Start

```bash
# Clone the repository
git clone <your-repo-url> SweetBiteBakery
cd SweetBiteBakery

# Install dependencies
npm install

# Run the development server
npm run dev
```

Visit http://localhost:5000 to see your bakery! 🎉

## 📖 Full Setup Guide

For detailed setup instructions, database configuration, and troubleshooting, see:

👉 **[SETUP_GUIDE.md](./SETUP_GUIDE.md)**

## 🛠️ Tech Stack

### Frontend
- **React** - UI library
- **TypeScript** - Type safety
- **Wouter** - Routing
- **TanStack Query** - Data fetching
- **Tailwind CSS** - Styling

### Backend
- **Express.js** - Web framework
- **Drizzle ORM** - Database toolkit
- **Neon/PostgreSQL** - Database
- **TypeScript** - Type safety

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL (optional - for persistent storage)

## 🎯 Project Structure

```
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types and schemas
└── db/              # Database migrations
```

## 🔧 Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Run production build |
| `npm run db:push` | Update database schema |
| `npm run db:studio` | Open database GUI |

## 🌟 Default Admin Access

**In-Memory Mode:**
- Username: `admin`
- Password: `admin123`

> ⚠️ Change these credentials in production!

## 📸 Screenshots

### Home Page
Beautiful landing page with featured products

### Product Catalog
Browse all products with category filtering

### Admin Dashboard
Manage your bakery inventory

## 🔄 Development Workflow

1. **Make changes** to client or server code
2. **Hot reload** automatically updates
3. **Test** your changes locally
4. **Commit** and push to repository

## 🚢 Deployment

The application can be deployed to:

- **Vercel** (recommended for frontend)
- **Railway** (full-stack)
- **Render** (full-stack)
- **Heroku** (full-stack)

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for deployment instructions.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by real bakery websites
- Community-driven development

## 📞 Support

Need help? Check out:

- 📖 [Setup Guide](./SETUP_GUIDE.md)
- 🐛 [Issue Tracker](https://github.com/yourusername/SweetBiteBakery/issues)
- 💬 [Discussions](https://github.com/yourusername/SweetBiteBakery/discussions)

---

Made with ❤️ and lots of 🍰

**Happy Coding!**
