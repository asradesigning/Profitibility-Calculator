# Profitability Analysis Tool - Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [System Requirements](#system-requirements)
3. [Installation Guide](#installation-guide)
4. [Configuration](#configuration)
   - [Environment Variables](#environment-variables)
   - [Database Setup](#database-setup)
   - [OpenAI API Key](#openai-api-key)
5. [Usage Guide](#usage-guide)
   - [Authentication](#authentication)
   - [Dashboard](#dashboard)
   - [Reports](#reports)
   - [Data Entry](#data-entry)
   - [Scenario Analysis](#scenario-analysis)
6. [Technical Architecture](#technical-architecture)
   - [Frontend](#frontend)
   - [Backend](#backend)
   - [Database](#database)
7. [Customization Guide](#customization-guide)
   - [Adding New Features](#adding-new-features)
   - [Modifying Existing Components](#modifying-existing-components)
   - [Styling and Themes](#styling-and-themes)
8. [Troubleshooting](#troubleshooting)
9. [Maintenance](#maintenance)

---

## Introduction

The Profitability Analysis Tool is a comprehensive financial analytics application designed to help businesses evaluate the profitability of projects and investments. The tool transforms complex business data into intuitive, visually engaging financial insights, enabling users to make data-driven decisions with ease.

Key features include:
- Interactive financial dashboards with key performance indicators
- Multi-scenario analysis (Optimistic, Realistic, Pessimistic)
- Detailed reports with visual charts
- Custom recommendations powered by AI
- Revenue and expense projections
- Break-even analysis
- Return on Investment (ROI) calculations

---

## System Requirements

- Node.js (v18.0.0 or higher)
- npm (v8.0.0 or higher)
- PostgreSQL (v14.0 or higher)
- Modern web browser (Chrome, Firefox, Safari, Edge)

---

## Installation Guide

1. Clone the repository to your local machine:
   ```
   git clone [repository-url]
   cd profitability-analysis-tool
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory (see [Configuration](#configuration) section for details)

4. Set up the database:
   ```
   npm run db:push
   ```

5. Start the development server:
   ```
   npm run dev
   ```

6. Access the application at `http://localhost:5000`

---

## Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Database Configuration
DATABASE_URL=postgresql://username:password@hostname:port/database_name

# Application Security
APP_SECRET=your_secure_random_string_for_session_encryption

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key
```

### Database Setup

1. Create a PostgreSQL database for the application
2. Update the `DATABASE_URL` in your `.env` file with the connection string
3. The application will automatically create all necessary tables on startup

Database schema includes:
- `users`: User authentication data
- `projects`: Business project information
- `scenarios`: Different financial scenarios for each project

### OpenAI API Key

The application uses OpenAI's API for generating financial recommendations and insights. To obtain an API key:

1. Create an account at [OpenAI's platform](https://platform.openai.com/)
2. Navigate to API Keys section and create a new key
3. Copy this key to your `.env` file under `OPENAI_API_KEY`

---

## Usage Guide

### Authentication

1. **Registration**:
   - Click on "Register" on the login page
   - Create a username and password
   - Your account will be created and you'll be logged in automatically

2. **Login**:
   - Enter your username and password
   - Click "Login" to access your dashboard

### Dashboard

The dashboard provides an overview of your financial data with the following sections:

1. **Project Selection**: Choose from your existing projects using the dropdown at the top
2. **Scenario Selection**: Toggle between Optimistic, Realistic, and Pessimistic scenarios
3. **KPI Summary**: Key metrics including ROI, Break-even point, Net Profit, and Profit Margin
4. **Charts**:
   - Revenue vs Expenses chart
   - Profit Projection chart
   - Cost Breakdown chart
5. **Recommendations**: AI-generated suggestions based on your financial data

### Reports

The Reports page offers detailed financial analysis with several tabs:

1. **Summary**: High-level overview of project metrics
2. **Detailed**: In-depth financial data for the selected project
3. **Comparison**: Side-by-side comparison of different scenarios
4. **Charts**: Visual representations of financial projections

Use the "Print Report" button to generate a comprehensive report for sharing or printing.

### Data Entry

To add or modify project data:

1. Click "Modifier les Données du Projet" on the dashboard
2. Fill in the required fields:
   - Project name and description
   - Industry type
   - Time horizon (in months)
   - Initial investment amount
   - Monthly fixed costs
   - Variable costs (as percentage of revenue)
   - Expected monthly revenue
3. Adjust scenario parameters:
   - Growth rate for each scenario
   - Cost adjustment factors
4. Click "Save" to update your project data

### Scenario Analysis

The tool provides three default scenarios:

1. **Realistic**: Base case with standard growth and cost assumptions
2. **Optimistic**: Higher growth rate and lower costs
3. **Pessimistic**: Lower growth rate and higher costs

Each scenario can be customized with specific parameters to reflect different business conditions.

---

## Technical Architecture

### Frontend

The frontend is built with:
- **React**: UI component library
- **TypeScript**: Type-safe JavaScript
- **TailwindCSS**: Utility-first CSS framework
- **Shadcn UI**: Component library
- **Recharts**: Charting library
- **React Query**: Data fetching and state management
- **React Hook Form**: Form validation and submission

Key frontend files/directories:
- `client/src/components`: UI components
- `client/src/pages`: Page components
- `client/src/hooks`: Custom React hooks
- `client/src/lib`: Utility functions

### Backend

The backend is built with:
- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **TypeScript**: Type-safe JavaScript
- **Drizzle ORM**: Database ORM
- **PostgreSQL**: Relational database
- **Passport**: Authentication middleware
- **OpenAI API**: AI recommendations

Key backend files/directories:
- `server/index.ts`: Entry point
- `server/routes.ts`: API routes
- `server/auth.ts`: Authentication logic
- `server/storage.ts`: Database operations
- `server/services/openai.ts`: AI integration

### Database

The database schema is defined in `shared/schema.ts` and includes:

- **Users table**: Stores user authentication data
- **Projects table**: Stores project details and financial parameters
- **Scenarios table**: Stores scenario-specific parameters for each project

---

## Customization Guide

### Adding New Features

To add new features to the application:

1. **Backend Changes**:
   - Add new routes in `server/routes.ts`
   - Implement data access in `server/storage.ts`
   - Update database schema in `shared/schema.ts` if needed

2. **Frontend Changes**:
   - Create new components in `client/src/components`
   - Add new pages in `client/src/pages`
   - Update routing in `client/src/App.tsx`

### Modifying Existing Components

To modify existing components:

1. Locate the component in `client/src/components`
2. Make desired changes to the component code
3. Test changes by running the application

Key components that you might want to customize:
- Dashboard layout: `client/src/pages/dashboard.tsx`
- Reports page: `client/src/pages/reports.tsx`
- Charts: `client/src/components/charts/`
- Data entry form: `client/src/components/data-entry-form.tsx`

### Styling and Themes

The application uses TailwindCSS for styling. To change the visual theme:

1. Modify `theme.json` in the root directory to change primary colors and theme parameters
2. Update specific component styles in their respective files using TailwindCSS classes
3. For global styles, edit `client/src/index.css`

---

## Troubleshooting

**Application fails to start**
- Check that all dependencies are installed: `npm install`
- Verify that environment variables are set correctly in `.env`
- Make sure PostgreSQL is running and accessible

**Database connection issues**
- Verify the `DATABASE_URL` in `.env` is correct
- Check that PostgreSQL is running
- Ensure the database specified in the URL exists

**AI recommendations not working**
- Verify your OpenAI API key is valid and has sufficient quota
- Check network connectivity to OpenAI's API
- Look for error messages in the server logs

**Charts not displaying properly**
- Check browser console for JavaScript errors
- Verify that the data being passed to chart components is formatted correctly
- Make sure the container div has sufficient height and width

---

## Maintenance

Regular maintenance tasks include:

1. **Database backups**: Schedule regular backups of your PostgreSQL database
2. **Dependency updates**: Periodically run `npm outdated` and update dependencies
3. **Security patches**: Apply security patches to Node.js and other components
4. **Performance monitoring**: Monitor application performance and optimize as needed
5. **User feedback**: Collect and implement user feedback for continuous improvement