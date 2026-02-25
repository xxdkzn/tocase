# Telegram NFT Case Opener 🎁

A premium Telegram Mini App for opening NFT cases with provably fair mechanics. Users can open cases to win NFTs, manage their inventory, and verify the fairness of each opening using cryptographic verification.

## ✨ Features

- **Provably Fair System**: Cryptographic verification ensures transparent and fair case openings
- **NFT Case Opening**: Multiple cases with different NFT collections and rarities
- **User Inventory**: View and manage collected NFTs
- **Sell System**: Convert unwanted NFTs to in-game currency
- **Level & Experience**: Progress system with XP rewards for opening cases
- **Opening History**: Track all past case openings with filtering options
- **Admin Panel**: Comprehensive management interface for cases, NFTs, and users
- **Automated NFT Updates**: Scheduled scraping of NFT data from GetGems
- **Anti-Abuse Protection**: Rate limiting and suspicious activity detection
- **Telegram Integration**: Seamless authentication and native Telegram features (haptics, sounds)

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase) / SQLite (development)
- **Authentication**: JWT + Telegram Web App authentication
- **Bot Framework**: Telegraf
- **Scraping**: Cheerio + Axios
- **Scheduling**: node-cron

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Routing**: React Router v6
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Telegram SDK**: @telegram-apps/sdk

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** 18.0.0 or higher
- **npm** (comes with Node.js)
- **Git** for version control
- **Telegram Bot** created via [@BotFather](https://t.me/BotFather)

For production deployment:
- **Render** account (backend hosting)
- **Vercel** account (frontend hosting)
- **Supabase** account (PostgreSQL database)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd telegram-nft-case-opener
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Configure Environment Variables

#### Backend Configuration

Create `backend/.env` from the example:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your values:

```env
# Server
NODE_ENV=development
PORT=3000

# Telegram Bot
BOT_TOKEN=your_bot_token_from_botfather
ADMIN_USERNAME=your_telegram_username

# Database (SQLite for development)
DATABASE_TYPE=sqlite
DATABASE_PATH=./data/database.sqlite

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your_random_secret_key

# NFT Data Source
NFT_DATA_SOURCE_URL=https://getgems.io/collection/YOUR_COLLECTION

# CORS
FRONTEND_URL=http://localhost:5173
```

#### Frontend Configuration

Create `frontend/.env` from the example:

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_BOT_USERNAME=your_bot_username
VITE_ENABLE_SOUND=true
VITE_ENABLE_HAPTICS=true
```

### 4. Initialize Database

The backend automatically creates tables on first run, but you can manually run migrations:

```bash
cd backend
npm run migrate
```

### 5. Start Development Servers

#### Option A: Start Both Servers Together

From the project root:

```bash
npm run dev
```

#### Option B: Start Servers Separately

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

### 6. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/api/health

### 7. Configure Telegram Bot

1. Open [@BotFather](https://t.me/BotFather) in Telegram
2. Set bot commands:
   ```
   /setcommands
   start - Start the bot and open the app
   help - Get help information
   balance - Check your balance
   profile - View your profile
   ```

3. Set menu button (for development):
   ```
   /setmenubutton
   ```
   - Button text: "Open App"
   - Web App URL: `http://localhost:5173` (or use ngrok for testing)

## 📁 Project Structure

```
telegram-nft-case-opener/
├── backend/                    # Backend API and bot
│   ├── src/
│   │   ├── bot/               # Telegram bot logic
│   │   ├── middleware/        # Express middleware (auth, rate limiting)
│   │   ├── routes/            # API route handlers
│   │   ├── services/          # Business logic
│   │   │   ├── auth.ts        # Authentication service
│   │   │   ├── caseService.ts # Case opening logic
│   │   │   ├── rngService.ts  # Provably fair RNG
│   │   │   ├── nftScraper.ts  # NFT data scraping
│   │   │   └── ...
│   │   ├── types/             # TypeScript type definitions
│   │   └── index.ts           # Server entry point
│   ├── data/                  # SQLite database (development)
│   ├── .env.example           # Environment variables template
│   └── package.json
│
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── admin/         # Admin panel components
│   │   │   ├── CaseCard.tsx
│   │   │   ├── CaseOpeningAnimation.tsx
│   │   │   └── ...
│   │   ├── pages/             # Page components
│   │   │   ├── admin/         # Admin pages
│   │   │   ├── HomePage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   └── ...
│   │   ├── services/          # API and utility services
│   │   │   ├── api.ts         # API client
│   │   │   ├── audioManager.ts # Sound effects
│   │   │   └── telegram.ts    # Telegram SDK wrapper
│   │   ├── store/             # Zustand state management
│   │   ├── types/             # TypeScript types
│   │   └── App.tsx            # Root component
│   ├── public/                # Static assets
│   │   └── sounds/            # Audio files
│   ├── .env.example
│   └── package.json
│
├── .github/                    # GitHub Actions workflows
├── docs/                       # Documentation (this folder)
│   ├── API_DOCUMENTATION.md
│   ├── USER_GUIDE.md
│   ├── ADMIN_GUIDE.md
│   └── SCALING_STRATEGY.md
├── DEPLOYMENT.md              # Deployment instructions
├── SECURITY.md                # Security best practices
├── package.json               # Root package.json (workspaces)
└── README.md                  # This file
```

## 🔗 Documentation Links

- **[API Documentation](./API_DOCUMENTATION.md)** - Complete API reference with examples
- **[User Guide](./USER_GUIDE.md)** - How to use the Telegram Mini App
- **[Admin Guide](./ADMIN_GUIDE.md)** - Admin panel usage and best practices
- **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment instructions
- **[Security Guide](./SECURITY.md)** - Security features and best practices
- **[Scaling Strategy](./SCALING_STRATEGY.md)** - Resource usage and scaling recommendations

## 🧪 Testing

### Run Backend Tests

```bash
cd backend
npm test
```

### Run Frontend Tests

```bash
cd frontend
npm test
```

### Lint Code

```bash
# Lint all workspaces
npm run lint

# Lint specific workspace
npm run lint --workspace=backend
npm run lint --workspace=frontend
```

## 🏗️ Building for Production

### Build Backend

```bash
cd backend
npm run build
```

This creates a `dist/` folder with compiled JavaScript.

### Build Frontend

```bash
cd frontend
npm run build
```

This creates a `dist/` folder optimized for production.

### Build Both

From the project root:

```bash
npm run build
```

## 🚢 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed production deployment instructions using:
- **Render** (backend)
- **Vercel** (frontend)
- **Supabase** (database)

Quick deploy checklist:
1. Set up Supabase database
2. Deploy backend to Render with environment variables
3. Deploy frontend to Vercel with environment variables
4. Configure Telegram bot webhook and menu button
5. Test the application end-to-end

## 🔐 Security

This application implements multiple security measures:
- HTTPS enforcement in production
- JWT-based authentication
- Rate limiting on all endpoints
- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- XSS protection (React auto-escaping + CSP headers)
- Anti-abuse detection for suspicious activities

See [SECURITY.md](./SECURITY.md) for complete security documentation.

## 📊 Monitoring

### Health Check Endpoint

```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Database Status

Check database connection and table status through the admin panel or logs.

### NFT Scraper Status

Admin users can view scraper status at `/admin/nft-data` or via API:

```bash
GET /api/admin/nft/status
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow existing code formatting (Prettier)
- Add JSDoc comments for public functions
- Write tests for new features

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter issues:

1. Check the [documentation](./docs/)
2. Review [common issues](./DEPLOYMENT.md#troubleshooting)
3. Check application logs (backend and frontend)
4. Verify environment variables are set correctly

## 🙏 Acknowledgments

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)
- [GetGems](https://getgems.io) for NFT data
- All open-source libraries used in this project

---

**Built with ❤️ for the Telegram ecosystem**
