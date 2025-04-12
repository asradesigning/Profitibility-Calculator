# Profitability Analysis Tool

A professional business profitability analysis application that transforms complex financial data into intuitive, visually engaging financial insights, enabling users to make data-driven decisions with ease.

## Features

- Interactive financial dashboards with real-time calculations
- Multi-scenario analysis (Optimistic, Realistic, Pessimistic)
- Detailed financial reporting with data visualization
- AI-powered recommendations and insights
- Break-even analysis and ROI calculations
- Cost breakdown and profit projections
- User authentication and project management

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS, Shadcn UI, Recharts
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: OpenAI API
- **Authentication**: Passport.js
- **Data Fetching**: React Query

## Quick Start

### Prerequisites

- Node.js (v18+)
- npm
- PostgreSQL database

### Installation

1. Clone the repository:
   ```
   git clone [repository-url]
   cd profitability-analysis-tool
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   # Database
   DATABASE_URL=postgresql://username:password@hostname:port/database_name
   
   # App Security
   APP_SECRET=your_secure_random_string_for_session_encryption
   
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key
   ```

4. Initialize the database:
   ```
   npm run db:push
   ```

5. Start the development server:
   ```
   npm run dev
   ```

6. Access the application at `http://localhost:5000`

## Project Structure

```
├── client/                  # Frontend code
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── charts/      # Chart components
│   │   │   └── ui/          # UI components (Shadcn)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility functions
│   │   ├── pages/           # Page components
│   │   ├── App.tsx          # Main application component
│   │   └── main.tsx         # Entry point
│   └── index.html           # HTML template
├── server/                  # Backend code
│   ├── services/            # Service modules
│   │   └── openai.ts        # OpenAI integration
│   ├── auth.ts              # Authentication logic
│   ├── db.ts                # Database connection
│   ├── index.ts             # Server entry point
│   ├── routes.ts            # API routes
│   ├── storage.ts           # Database operations
│   └── vite.ts              # Vite server configuration
├── shared/                  # Shared code (frontend & backend)
│   └── schema.ts            # Database schema and types
├── drizzle.config.ts        # Drizzle ORM configuration
├── package.json             # Project dependencies
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite configuration
```

## Development Guide

### Database Schema

The database schema is defined in `shared/schema.ts`:

- **Users**: Authentication and user profile data
- **Projects**: Project details and financial parameters
- **Scenarios**: Different financial scenarios for each project

All database operations are abstracted through the `IStorage` interface in `server/storage.ts`.

### API Routes

The API routes are defined in `server/routes.ts`:

- Authentication: `/api/users/login`, `/api/users/register`, `/api/users/logout`
- Projects: `/api/projects`
- Analysis: `/api/analysis`
- AI Integration: `/api/generate-questions`, `/api/recommendations`

### Frontend Components

Key frontend components include:

- **Dashboard**: Main interface with financial overview (`client/src/pages/dashboard.tsx`)
- **Reports**: Detailed financial analysis (`client/src/pages/reports.tsx`)
- **Charts**: Data visualization components (`client/src/components/charts/`)
- **Forms**: Data entry forms (`client/src/components/data-entry-form.tsx`)

### Authentication

User authentication is implemented using:

- **Passport.js**: Authentication middleware
- **Express Sessions**: Session management
- **PostgreSQL**: Session storage

### AI Integration

The application leverages OpenAI's API to generate:

- Financial recommendations based on project data
- Missing data questions for improved analysis
- Financial metrics explanations

The AI integration is implemented in `server/services/openai.ts`.

## Building for Production

To build the application for production:

```
npm run build
```

This will create:
- Frontend build in `dist/`
- Server build in `dist-server/`

## Running in Production

To run the application in production:

```
npm start
```

## License

This project is proprietary software. All rights reserved.

## Support

For technical support or feature requests, please contact your administrator or IT support team.
