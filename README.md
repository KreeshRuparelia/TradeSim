# TradeSim - Stock Market Simulator

TradeSim is a full-stack, stock trading simulator that allows users to practice trading, while working with real-time market data. Designed to help beginners learn their fundamentals and apply them in a risk-free environment.

![TradeSim Dashboard](https://img.shields.io/badge/Status-Active-success) ![License](https://img.shields.io/badge/License-MIT-blue)

## Features

- **Real-Time Stock Quotes** - Live market data powered by Finnhub API
- **Virtual Trading** - Buy and sell stocks with $10,000 in virtual cash
- **Portfolio Management** - Track holdings, gains/losses, and portfolio performance
- **Transaction History** - Complete audit trail of all trades
- **Multiple Portfolios** - Create and manage separate portfolios for different strategies
- **Learn Section** - Financial news and educational resources via Marketaux API

## Tech Stack

### Frontend
- React with TypeScript
- Vite
- Tailwind CSS
- React Router

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL
- JWT authentication

### APIs
- **Finnhub** - Real-time stock quotes and search
- **Marketaux** - Financial news articles

## Getting Started

### Prerequisites

- Node.js
- PostgreSQL
- Finnhub API key (free at https://finnhub.io)
- Marketaux API key (free at https://marketaux.com)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/KreeshRuparelia/TradeSim.git
   cd TradeSim
   ```

2. **Set up the database**
   ```bash
   psql -U postgres
   CREATE DATABASE tradesim;
   \q
   
   psql -U postgres -d tradesim -f server/src/db/migrations/001_initial_schema.sql
   ```

3. **Configure the backend**
   ```bash
   cd server
   cp .env.example .env
   ```
   
   Edit `server/.env`:

4. **Configure the frontend**
   ```bash
   cd ../client
   cp .env.example .env
   ```
   
   Edit `client/.env`:

5. **Install dependencies and run**
   ```bash
   # Terminal 1 - Backend
   cd server
   npm install
   npm run dev

   # Terminal 2 - Frontend
   cd client
   npm install
   npm run dev
   ```

6. **Open the app**
   
   Visit `http://localhost:5173` in your browser

## Project Structure

```
TradeSim/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React context providers
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service functions
│   │   └── types/          # TypeScript type definitions
│   └── package.json
│
├── server/                 # Express backend
│   ├── src/
│   │   ├── config/         # Configuration management
│   │   ├── db/             # Database connection and migrations
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API route handlers
│   │   └── services/       # Business logic services
│   └── package.json
│
└── README.md
```

## API Endpoints

### Health
- `GET /api/health` - Health check with database status

### Users
- `GET /api/users/me` - Get current user profile

### Portfolios
- `GET /api/portfolios` - List user's portfolios
- `POST /api/portfolios` - Create new portfolio
- `GET /api/portfolios/:id` - Get portfolio details
- `PUT /api/portfolios/:id` - Update portfolio
- `DELETE /api/portfolios/:id` - Delete portfolio

### Holdings
- `GET /api/portfolios/:id/holdings` - Get portfolio holdings with current values

### Trading
- `POST /api/trade/buy` - Buy stocks
- `POST /api/trade/sell` - Sell stocks

### Transactions
- `GET /api/transactions` - Get transaction history

### Stocks
- `GET /api/stocks/quote/:symbol` - Get stock quote
- `GET /api/stocks/search?q=` - Search stocks

## Database Schema

- **users** - User accounts
- **portfolios** - Investment portfolios with cash balance
- **holdings** - Stock positions within portfolios
- **transactions** - Trade history audit trail
- **watchlist** - Saved stocks for monitoring

## Deployment

1. Create a PostgreSQL database using Amazon RDS and configure security groups to allow access from ECS.
2. Create a Cognito User Pool and App Client, and configure Hosted UI callback and sign-out URLs.
3. Build the backend as a Docker image, push it to Amazon ECR, and deploy it using ECS Fargate behind an Application Load Balancer.
4. Configure ECS task environment variables for database access and Cognito authentication.
5. Build the frontend and upload the static assets to an S3 bucket, then serve them globally using CloudFront.
6. Update frontend environment variables to point to the CloudFront domain and the deployed backend API.

## License

MIT License - feel free to use this project for learning and personal use.

## Author

**Kreesh Ruparelia**
- GitHub: [@KreeshRuparelia](https://github.com/KreeshRuparelia)
- LinkedIn: [/KreeshRuparelia](https://linkedin.com/in/KreeshRuparelia)
