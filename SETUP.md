# Development Setup Guide

## First-Time Setup

### 1. Install Dependencies

```bash
# Navigate to project root
cd StudyAbroad

# Install all dependencies (installs both backend and frontend)
npm install
```

This will install:
- Root dependencies (turbo, husky, lint-staged)
- Backend dependencies (Express, Prisma, TypeScript, etc.)
- Frontend dependencies (React, Vite, Tailwind, etc.)

### 2. Setup Husky Hooks

After npm install, Husky should be automatically installed. To manually setup or re-setup:

```bash
npm run prepare
```

This will:
- Install Git hooks in `.husky/`
- Setup pre-commit and pre-push hooks
- Enable automatic linting and type checking

### 3. Configure Database

#### Create PostgreSQL Database

```bash
# Using PostgreSQL command line
createdb study_abroad
```

Or use your preferred PostgreSQL client (pgAdmin, DBeaver, etc.)

#### Setup Backend Environment

```bash
cd backend

# Copy example env file
cp .env.example .env

# Edit .env with your database connection string
# Example:
# DATABASE_URL="postgresql://username:password@localhost:5432/study_abroad?schema=public"
```

#### Generate Prisma Client

```bash
npm run prisma:generate
```

#### Run Initial Migration

```bash
npm run prisma:migrate
```

This will create all database tables based on the schema.

### 4. Verify Setup

#### Check Backend

```bash
cd backend
npm run build
npm run dev
```

Visit `http://localhost:5000/api/health`

You should see:
```json
{
  "status": "success",
  "message": "API is healthy",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Check Frontend

In another terminal:
```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000`

You should see the Landing page.

## Daily Development

### Running Development Servers

**Option 1: Run both in parallel**
```bash
npm run dev
```

**Option 2: Run individually**
```bash
# Terminal 1
npm run backend

# Terminal 2
npm run frontend
```

### Code Quality

**Before committing** (automatic via Husky):
```bash
npm run lint-staged
```

**Manual checks**:
```bash
# Lint all code
npm run lint

# Format code
npm run format

# Check types
npm run type-check
```

## Git Workflow

### Starting a New Feature

```bash
# 1. Update develop branch
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Make changes
# (edit files)

# 4. Commit with conventional commit message
git add .
git commit -m "feat: add your feature description"
# Husky hooks will automatically run:
# - ESLint (with --fix)
# - Prettier
# - Type checking (on push)

# 5. Push to remote
git push origin feature/your-feature-name

# 6. Create Pull Request on GitHub/GitLab
```

### Updating Dependencies

```bash
# Check for outdated packages
npm outdated

# Update specific package
npm update package-name

# Update all packages
npm update
```

## Prisma Database Operations

### View Database (Prisma Studio)

```bash
npm run prisma:studio
```

This opens a visual editor at `http://localhost:5555`

### Create New Migration

```bash
# After modifying schema.prisma
npm run prisma:migrate

# You'll be prompted for migration name
# Example: "add_user_table"
```

### Reset Database (Development Only)

```bash
cd backend
npx prisma migrate reset
```

**⚠️ WARNING**: This deletes all data!

## Troubleshooting

### Port Already in Use

If port 5000 (backend) or 3000 (frontend) is in use:

**Backend:**
```bash
# Edit backend/.env
PORT=5001
```

**Frontend:**
```bash
# Edit frontend/vite.config.ts
server: {
  port: 3001,
  ...
}
```

### Database Connection Issues

```bash
# Test connection string
# Format: postgresql://[user][:password]@[host][:port]/[database]

# Common issues:
# - Wrong password
# - Database doesn't exist
# - PostgreSQL not running
# - Firewall blocking connection
```

### Husky Hooks Not Running

```bash
# Re-install Husky
npm run prepare

# Verify hooks exist
ls -la .husky/
```

### Dependencies Installation Failed

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Environment Variables Reference

### Backend (.env)

```
# Required
DATABASE_URL=postgresql://user:password@localhost:5432/study_abroad?schema=public

# Optional
NODE_ENV=development        # or "production"
PORT=5000                   # Server port
```

### Frontend (.env optional)

```
VITE_API_URL=http://localhost:5000/api
```

## VS Code Extensions Recommended

- ESLint
- Prettier - Code formatter
- Tailwind CSS IntelliSense
- Prisma
- Thunder Client (API testing)
- Git Graph

## Project Structure Explained

```
backend/
├── src/
│   ├── controllers/      # Business logic for routes
│   ├── middleware/       # Express middleware (error handling, etc.)
│   ├── routes/           # API route definitions
│   ├── utils/            # Helper functions
│   ├── config/           # Configuration (env, constants)
│   ├── app.ts            # Express app setup
│   └── index.ts          # Server startup
├── prisma/
│   └── schema.prisma     # Database schema definition
└── dist/                 # Built JavaScript (after npm run build)

frontend/
├── src/
│   ├── components/       # Reusable React components
│   ├── pages/            # Full-page components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities, types, API calls
│   ├── styles/           # Global CSS
│   ├── App.tsx           # Main component with routes
│   └── main.tsx          # React DOM render entry point
└── dist/                 # Built frontend (after npm run build)
```

## Database Schema Extension

To add new fields to Student model:

1. Edit `backend/prisma/schema.prisma`
2. Run `npm run prisma:migrate`
3. Follow the prompts

Example:
```prisma
model Student {
  // existing fields...
  newField    String?    // ? makes it optional
  
  // Add timestamps
  @@index([createdAt])   // Index for performance
}
```

## Best Practices

1. **Always pull before starting work**
   ```bash
   git checkout develop
   git pull origin develop
   ```

2. **Use descriptive commit messages**
   ```bash
   ✅ git commit -m "feat: add student profile form with validation"
   ❌ git commit -m "fixed stuff"
   ```

3. **Keep branches up-to-date**
   ```bash
   git fetch origin
   git rebase origin/develop
   ```

4. **Don't commit secrets**
   - `.env` files are in `.gitignore`
   - Never commit API keys or passwords

5. **Test before pushing**
   ```bash
   npm run lint
   npm run type-check
   npm run build
   ```

## Useful Commands Reference

```bash
# Project root
npm run dev              # Start all services
npm run build            # Build all packages
npm run lint             # Lint all code
npm run format           # Format all code
npm run type-check       # Type check all code

# Backend specific
cd backend && npm run dev
cd backend && npm run prisma:studio
cd backend && npm run prisma:migrate

# Frontend specific
cd frontend && npm run dev
cd frontend && npm run build

# Git
git status              # Check status
git log --oneline      # View commits
git branch -a          # View all branches
git diff               # View changes
```

## Getting Help

- Check the main [README.md](README.md)
- Review code comments
- Check TypeScript errors for hints
- Review Prisma documentation: https://www.prisma.io/docs
- Review React documentation: https://react.dev

---

Happy coding! 🚀
