# Project Architecture

## Overview

The Germany Study Abroad Platform is built as a **monorepo** using npm workspaces with separate frontend and backend packages. This architecture provides scalability, code reusability, and independent deployment.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)              │
│                                                          │
│  ┌────────────────┬──────────────┬────────────────┐    │
│  │   Pages        │  Components  │  Custom Hooks  │    │
│  │  - Landing     │  - Header    │  - useHealth   │    │
│  │  - Dashboard   │  - Sidebar   │  - useQuery*   │    │
│  │  - Profile     │  - Card      │  - useForm*    │    │
│  │  - Universities│  - Button    │                │    │
│  │  - Timeline    │  - Input     │                │    │
│  │  - Tracker     │  - Select    │                │    │
│  └────────────────┴──────────────┴────────────────┘    │
│                          ↓                               │
│            API Layer (fetch/TanStack Query)             │
└─────────────────────────────────────────────────────────┘
                          ↓ HTTP/JSON
        ┌─────────────────────────────────────┐
        │  API Gateway / CORS Handler         │
        └─────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                 BACKEND (Express.js)                    │
│                                                          │
│  ┌───────────────────────────────────────────────┐     │
│  │  Routes                                       │     │
│  │  /api/health                                  │     │
│  │  /api/students/* (future)                     │     │
│  │  /api/universities/* (future)                 │     │
│  └───────────────────────────────────────────────┘     │
│                      ↓                                   │
│  ┌───────────────────────────────────────────────┐     │
│  │  Controllers (Business Logic)                 │     │
│  │  - healthController                          │     │
│  │  - studentController (future)                │     │
│  │  - universityController (future)             │     │
│  └───────────────────────────────────────────────┘     │
│                      ↓                                   │
│  ┌───────────────────────────────────────────────┐     │
│  │  Middleware                                   │     │
│  │  - errorHandler                              │     │
│  │  - requestLogger (future)                    │     │
│  │  - authentication (future)                   │     │
│  └───────────────────────────────────────────────┘     │
│                      ↓                                   │
│  ┌───────────────────────────────────────────────┐     │
│  │  ORM Layer (Prisma)                           │     │
│  │  - Database abstractions                      │     │
│  │  - Query builders                             │     │
│  │  - Migrations                                 │     │
│  └───────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
                          ↓
        ┌─────────────────────────────────────┐
        │     PostgreSQL Database             │
        │     - Students                      │
        │     - (Universities - future)       │
        │     - (Applications - future)       │
        └─────────────────────────────────────┘
```

## Frontend Architecture

### Directory Structure

```
frontend/
├── src/
│   ├── components/           # Reusable React components
│   │   ├── ui/              # UI components (Button, Input, Card)
│   │   ├── Header.tsx       # Top header component
│   │   ├── Sidebar.tsx      # Navigation sidebar
│   │   └── Layout.tsx       # Main layout wrapper
│   │
│   ├── pages/               # Full-page components (route pages)
│   │   ├── Landing.tsx      # Home/entry page
│   │   ├── Dashboard.tsx    # Dashboard overview
│   │   ├── Profile.tsx      # Student profile management
│   │   ├── Universities.tsx # University browsing
│   │   ├── Timeline.tsx     # Application timeline
│   │   └── Tracker.tsx      # Application tracking
│   │
│   ├── hooks/               # Custom React hooks
│   │   └── useHealth.ts     # API health check hook
│   │
│   ├── lib/                 # Utilities and library functions
│   │   ├── api.ts          # API client functions
│   │   ├── types.ts        # TypeScript interfaces
│   │   └── utils.ts        # Helper functions
│   │
│   ├── styles/              # Global styles
│   │   └── index.css       # Tailwind + global CSS
│   │
│   ├── App.tsx              # Main app component with routing
│   └── main.tsx             # React entry point
│
├── index.html               # HTML template
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
└── tsconfig.json           # TypeScript configuration
```

### Component Hierarchy

```
<App>
  ├── <Layout>
  │   ├── <Sidebar>
  │   ├── <Header>
  │   └── <Outlet> (page component)
  │       ├── <Landing>
  │       ├── <Dashboard>
  │       │   ├── <Card>
  │       │   └── <Button>
  │       ├── <Profile>
  │       ├── <Universities>
  │       ├── <Timeline>
  │       └── <Tracker>
```

### Data Flow

```
User Action
    ↓
Page Component
    ↓
Custom Hook (useHealth, useQuery)
    ↓
API Layer (lib/api.ts)
    ↓
TanStack Query Cache
    ↓
Backend API
```

## Backend Architecture

### Directory Structure

```
backend/
├── src/
│   ├── controllers/        # Request handlers (business logic)
│   │   └── healthController.ts
│   │
│   ├── routes/             # API endpoint definitions
│   │   └── health.ts
│   │
│   ├── middleware/         # Express middleware
│   │   └── errorHandler.ts
│   │
│   ├── utils/              # Utility functions
│   │   └── logger.ts
│   │
│   ├── config/             # Configuration
│   │   └── env.ts         # Environment variable handling
│   │
│   ├── app.ts              # Express app setup
│   └── index.ts            # Server startup
│
├── prisma/
│   └── schema.prisma      # Database schema
│
├── dist/                   # Compiled JavaScript
└── package.json
```

### Request Flow

```
HTTP Request
    ↓
Express Middleware (CORS, bodyParser)
    ↓
Router (matches route)
    ↓
Controller (business logic)
    ↓
Prisma Client (database query)
    ↓
PostgreSQL Database
    ↓
Response JSON
    ↓
HTTP Response
```

### API Endpoints

**Current (Phase 1):**
- `GET /api/health` - Health check

**Future (Phase 2+):**
- `POST /api/students` - Create student profile
- `GET /api/students/:id` - Get student profile
- `PUT /api/students/:id` - Update student profile
- `GET /api/universities` - List universities
- `GET /api/universities/:id` - Get university details
- etc.

## Database Schema

### Current Model (Phase 1)

```prisma
Student {
  id                  String  @id @default(cuid())
  
  // Personal Info
  fullName            String
  email               String  @unique
  country             String
  
  // Academic Status
  degreeStatus        String  // "completed" | "ongoing"
  degree              String
  specialization      String
  
  // For Ongoing Students
  currentSemester     Int?
  graduationDate      DateTime?
  expectedCgpa        Float?
  
  // For Completed Students
  cgpa                Float?
  
  // IELTS/TOEFL
  ieltsScore          Float?
  expectedIeltsScore  Float?
  plannedIeltsDate    DateTime?
  
  // Preferences
  budget              Float?
  preferredIntake     String?
  preferredCourse     String?
  
  // Timestamps
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

### Future Models

- **University** - German universities and programs
- **Application** - Student applications to universities
- **Timeline** - Personalized timelines
- **Document** - Application documents
- **User** - Authentication and user accounts

## Technology Choices & Rationale

### Frontend

| Technology | Why |
|---|---|
| React 19 | Latest version, excellent ecosystem, component reusability |
| Vite | Fast dev server, optimized builds, modern bundler |
| TypeScript | Type safety, better IDE support, fewer runtime errors |
| Tailwind CSS | Utility-first, highly customizable, good for rapid UI |
| React Router | Industry standard for SPAs, nested routing support |
| TanStack Query | Efficient server state management, caching, sync |
| React Hook Form | Lightweight, performant form handling |
| Zod | Runtime schema validation, type inference |

### Backend

| Technology | Why |
|---|---|
| Node.js + Express | JavaScript ecosystem, lightweight, scalable |
| TypeScript | Type safety for backend, consistency with frontend |
| Prisma ORM | Type-safe, auto-migration, great DX |
| PostgreSQL | Robust, scalable, excellent JSON support |
| Zod | Shared validation with frontend |

### Development

| Technology | Why |
|---|---|
| npm Workspaces | Monorepo management, shared dependencies |
| Turbo | Builds, parallelization, caching |
| ESLint | Code quality, consistency |
| Prettier | Code formatting, team alignment |
| Husky | Git hooks automation |
| lint-staged | Fast pre-commit checks |

## Scalability Considerations

### Current Foundation

✅ Modular architecture with clear separation of concerns
✅ TypeScript for type safety at scale
✅ Prisma migrations for database versioning
✅ API versioning ready (`/api/v1/`, `/api/v2/`)
✅ Monorepo structure supports multiple services

### Future Improvements

- API rate limiting
- Caching layer (Redis)
- Database indexing strategy
- Authentication & authorization
- API documentation (OpenAPI/Swagger)
- Containerization (Docker)
- CI/CD pipeline

## Code Organization Principles

### DRY (Don't Repeat Yourself)
- Shared types in `lib/types.ts`
- Reusable UI components in `components/ui/`
- Utility functions in `lib/utils.ts`

### SOLID Principles
- **Single Responsibility**: Controllers handle one domain
- **Open/Closed**: Extensible without modification
- **Liskov**: Consistent interface contracts
- **Interface Segregation**: Minimal dependencies
- **Dependency Inversion**: Abstract dependencies

### Naming Conventions

**Components**: PascalCase (Landing.tsx, Dashboard.tsx)
**Hooks**: camelCase with 'use' prefix (useHealth.ts)
**Utilities**: camelCase (formatDate.ts, parseUrl.ts)
**Constants**: UPPER_SNAKE_CASE (API_BASE_URL)
**Types/Interfaces**: PascalCase (Student, ApiResponse)

## Performance Optimizations

### Frontend
- Code splitting with React Router
- Image optimization with modern formats
- CSS-in-JS with Tailwind (no unused styles)
- API response caching with TanStack Query
- Lazy loading for pages and components

### Backend
- Database indexing on frequently queried fields
- Response compression with gzip
- Connection pooling with Prisma
- Async/await for non-blocking operations

## Security Considerations

### Current Foundation
- CORS configuration
- Environment variable handling
- Type safety with TypeScript

### Future Enhancements
- JWT authentication
- Input validation & sanitization
- SQL injection prevention (Prisma ORM)
- HTTPS/TLS
- Rate limiting
- CSRF protection
- XSS prevention

---

## Document Updates

This architecture document should be updated when:
- Adding new major components
- Changing tech stack
- Adding new API endpoints
- Modifying database schema
- Implementing new patterns

Last Updated: January 2024
