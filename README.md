# Germany Study Abroad Platform

An AI-powered platform to help students plan and execute their study abroad journey in Germany.

## 📋 Project Overview

This is **Phase 1** - Foundation Setup of the Germany Study Abroad Platform. The platform supports both completed and ongoing students with a scalable, production-ready architecture.

## 🎯 Features (Phase 1)

### Frontend
- Responsive UI with React 19 and Vite
- Multiple pages: Landing, Dashboard, Profile, Universities, Timeline, Tracker
- Tailwind CSS for styling
- React Router for navigation
- TanStack Query for data fetching
- React Hook Form for form handling
- Zod for schema validation
- Shadcn/UI component library

### Backend
- Node.js + Express.js server
- TypeScript for type safety
- Prisma ORM with PostgreSQL
- Clean, scalable architecture
- Health check endpoint
- Error handling middleware
- Environment configuration

### Database
- PostgreSQL database
- Prisma schema with Student model
- Fields for both completed and ongoing students

### Development Standards
- ESLint + Prettier for code quality
- Husky pre-commit hooks
- lint-staged for automatic formatting
- Git branch strategy
- Comprehensive documentation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL database
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd StudyAbroad
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup Environment Variables**

   Backend (`.env`):
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your database URL
   DATABASE_URL="postgresql://user:password@localhost:5432/study_abroad?schema=public"
   NODE_ENV=development
   PORT=5000
   ```

4. **Setup Database**
   ```bash
   # Generate Prisma client
   npm run prisma:generate

   # Run migrations
   npm run prisma:migrate
   ```

5. **Start Development Servers**

   ```bash
   # Terminal 1: Start backend
   npm run backend

   # Terminal 2: Start frontend
   npm run frontend
   ```

   Or run both in parallel:
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
StudyAbroad/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── middleware/       # Custom middleware
│   │   ├── routes/           # API routes
│   │   ├── utils/            # Utility functions
│   │   ├── config/           # Configuration
│   │   ├── app.ts            # Express app setup
│   │   └── index.ts          # Server entry point
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities and types
│   │   ├── styles/           # Global styles
│   │   ├── App.tsx           # Main app component
│   │   └── main.tsx          # React entry point
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── package.json              # Root workspace config
├── tsconfig.base.json        # Base TypeScript config
├── .eslintrc.json            # ESLint configuration
├── .prettierrc.json          # Prettier configuration
└── README.md
```

## 🛠️ Available Commands

### Root Commands
```bash
# Development
npm run dev              # Run all services in development mode
npm run backend          # Run backend only
npm run frontend         # Run frontend only

# Build
npm run build            # Build all packages

# Code Quality
npm run lint             # Lint all packages
npm run format           # Format code with Prettier
npm run type-check       # Run TypeScript type checking
```

### Backend Commands
```bash
cd backend

# Development
npm run dev              # Start development server with auto-reload
npm run build            # Build TypeScript to JavaScript
npm run start            # Start production server

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio (visual editor)

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm run type-check       # Check TypeScript types
```

### Frontend Commands
```bash
cd frontend

# Development
npm run dev              # Start Vite dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm run type-check       # Check TypeScript types
```

## 📚 Database Schema

### Student Model
```prisma
model Student {
  id                  String
  fullName            String
  email               String (unique)
  country             String
  degreeStatus        String          // "completed" or "ongoing"
  degree              String
  specialization      String
  currentSemester     Int?
  graduationDate      DateTime?
  cgpa                Float?
  expectedCgpa        Float?
  ieltsScore          Float?
  expectedIeltsScore  Float?
  plannedIeltsDate    DateTime?
  budget              Float?
  preferredIntake     String?
  preferredCourse     String?
  createdAt           DateTime
  updatedAt           DateTime
}
```

## 🔌 API Endpoints

### Health Check
- **GET** `/api/health` - Check if API is running

Response:
```json
{
  "status": "success",
  "message": "API is healthy",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🌳 Git Branch Strategy

Follow this branch strategy:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature branches (e.g., `feature/auth-setup`)
- `bugfix/*` - Bug fix branches
- `release/*` - Release preparation branches

### Git Workflow

1. Create feature branch from `develop`
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. Make changes and commit
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

3. Push and create Pull Request
   ```bash
   git push origin feature/your-feature-name
   ```

4. Merge to `develop` after review
5. Release to `main` when ready

## 📝 Commit Message Convention

Follow Conventional Commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Build, dependencies, etc.

Example:
```bash
git commit -m "feat: add student profile page"
git commit -m "fix: resolve database connection error"
```

## 🔍 Code Quality

### ESLint
```bash
npm run lint              # Check for errors
npm run lint -- --fix     # Fix auto-fixable errors
```

### Prettier
```bash
npm run format            # Format all code
```

### Pre-commit Hooks
Husky automatically runs:
- ESLint checking
- Prettier formatting
- TypeScript type checking

This happens automatically on `git commit`.

## 🌍 Frontend Pages

### Landing Page
- Hero section with call-to-action
- Feature overview
- Entry point for new users

### Dashboard
- User overview and statistics
- Quick action cards
- API health status
- Getting started guide

### Profile
- Student profile form
- Academic information
- Personal details
- Status management

### Universities
- University search and filtering
- Program browsing
- Eligibility information
- (Matching engine - future feature)

### Timeline
- Personalized application timeline
- Milestone tracking
- Deadline management
- Step-by-step guidance

### Tracker
- Application status monitoring
- University tracking
- Document checklist
- Interview scheduling

## 🔒 Environment Variables

### Backend
```
DATABASE_URL          # PostgreSQL connection string
NODE_ENV              # development or production
PORT                  # Server port (default: 5000)
```

### Frontend
```
VITE_API_URL          # Backend API URL (optional, defaults to http://localhost:5000/api)
```

## 🚀 Deployment

### Backend
```bash
# Build
npm run build

# Set environment variables in production
# Run migrations
npm run prisma:migrate -- --skip-generate

# Start server
npm run start
```

### Frontend
```bash
# Build
npm run build

# Deploy dist folder to hosting service
# (Vercel, Netlify, AWS S3, etc.)
```

## 📚 Tech Stack Details

### Frontend Dependencies
- **React 19**: Latest version for UI rendering
- **Vite**: Fast build tool and dev server
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **TanStack Query**: Server state management
- **React Hook Form**: Efficient form handling
- **Zod**: Runtime schema validation
- **Lucide React**: Icon library

### Backend Dependencies
- **Express.js**: Web framework
- **Prisma**: ORM and database toolkit
- **PostgreSQL**: Database
- **TypeScript**: Type safety
- **Zod**: Schema validation

### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Husky**: Git hooks
- **lint-staged**: Run linters on staged files
- **Turbo**: Monorepo task runner

## 🤝 Future Features (Not in Phase 1)

- [ ] University matching engine
- [ ] AI recommendations
- [ ] SOP review
- [ ] Resume review
- [ ] Application tracker
- [ ] Visa tracker
- [ ] University scraping
- [ ] Germany chatbot
- [ ] User authentication
- [ ] File uploads
- [ ] Email notifications

## 📖 Additional Resources

- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Express.js Guide](https://expressjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)

## 📄 License

This project is proprietary and confidential.

## 👥 Support

For issues and questions, please create an issue in the repository.

---

**Happy coding! 🎓🇩🇪**
