# TODO (Roadmap)

## Phase 1 — Core Backend (HIGH PRIORITY)

### Models & Database
- [ ] **Models: User & Application**
  - [ ] Define Mongoose schemas for User and Application
  - [ ] Add database indexes for performance
  - [ ] Create database connection and initialization
  - [ ] Add unit tests for models

### Authentication System
- [ ] **Auth endpoints: POST /auth/signup, /auth/login, /auth/logout**
  - [ ] Implement password hashing with bcrypt
  - [ ] JWT token generation and verification
  - [ ] Auth middleware for protected routes
  - [ ] User registration and login validation
  - [ ] Swagger documentation for auth endpoints

### Applications CRUD API
- [ ] **Applications CRUD: GET/POST /applications, GET/PUT/DELETE /applications/:id**
  - [ ] GET /applications (with query filters: status, deadlineSoon)
  - [ ] POST /applications (create new application)
  - [ ] GET /applications/:id (get specific application)
  - [ ] PUT /applications/:id (update application)
  - [ ] DELETE /applications/:id (delete application)
  - [ ] All write operations require authentication
  - [ ] Proper error handling and validation

### Validation & Error Handling
- [ ] **Input validation and centralized error handling**
  - [ ] Implement validation schemas (using zod or express-validator)
  - [ ] Centralized error responder
  - [ ] HTTP status code mapping (400/401/403/404/500)
  - [ ] Request sanitization

### API Documentation
- [ ] **API docs (OpenAPI/Swagger)**
  - [ ] OpenAPI specification
  - [ ] Swagger UI at `/docs`
  - [ ] Interactive API testing interface

### Environment Setup
- [ ] **Environment configuration**
  - [ ] Create `.env.example` with all required variables
  - [ ] Set up environment variable loading
  - [ ] Database connection configuration
  - [ ] JWT secret management

**Acceptance Criteria for Phase 1:**
- [ ] Creating a user returns 201 with JWT; invalid payload → 400
- [ ] Login returns 200 + JWT; bad credentials → 401
- [ ] `GET /applications` filters by `status` and `deadlineSoon`
- [ ] All write operations require auth; unauthorized → 401
- [ ] Swagger UI accessible at `/docs`, schemas match runtime validation
- [ ] Frontend can successfully fetch and display applications

---

## Phase 2 — Frontend Core (HIGH PRIORITY)

### Authentication UI
- [ ] **Login / Signup pages**
  - [ ] Form validation and error states
  - [ ] Token storage and refresh logic
  - [ ] Error toast notifications
  - [ ] Protected route guards

### Applications Management
- [ ] **Applications List + Create/Edit forms**
  - [ ] Enhanced applications list with proper styling
  - [ ] Modal or dedicated page for create/edit
  - [ ] Form validation (client-side and server error handling)
  - [ ] Success/error feedback

### Status Management
- [ ] **Application status updates**
  - [ ] Status change functionality (SAVED → APPLIED → INTERVIEW → etc.)
  - [ ] Status change persists and re-renders list
  - [ ] Status indicators and badges

### Responsive Design
- [ ] **Basic responsive layout**
  - [ ] Mobile-first design approach
  - [ ] Tablet and desktop breakpoints
  - [ ] Touch-friendly interface elements

**Acceptance Criteria for Phase 2:**
- [ ] Unauthenticated users are redirected to Login
- [ ] Create/Edit form has client-side + server error states
- [ ] Status changes persist and immediately update the UI
- [ ] Application works on mobile, tablet, and desktop

---

## Phase 3 — Enhancements (MEDIUM PRIORITY)

### Deadline Management
- [ ] **Deadline alerts and UX**
  - [ ] "Due in N days" badge display
  - [ ] Deadline sorting and filtering
  - [ ] Optional notification system
  - [ ] Calendar integration (future)

### Search & Filtering
- [ ] **Advanced search and filtering**
  - [ ] Frontend search controls
  - [ ] API query parameter support
  - [ ] Empty states and loading states
  - [ ] Search result highlighting

### State Management
- [ ] **Improved state management**
  - [ ] React Query or Zustand for API state
  - [ ] Optimistic updates
  - [ ] Cache invalidation strategies
  - [ ] Offline support (future)

### Testing
- [ ] **Comprehensive testing setup**
  - [ ] API tests (supertest)
  - [ ] Frontend tests (Vitest + React Testing Library)
  - [ ] Integration tests
  - [ ] Sample test coverage

**Acceptance Criteria for Phase 3:**
- [ ] Users can search applications by company, role, status
- [ ] Deadline warnings appear for applications due soon
- [ ] State updates are optimistic and responsive
- [ ] Test coverage > 80% for critical paths

---

## Phase 4 — Production Ready (LOW PRIORITY)

### CI/CD Pipeline
- [ ] **Continuous Integration and Deployment**
  - [ ] GitHub Actions workflow
  - [ ] Lint, typecheck, test automation
  - [ ] Deploy to dev/staging/prod environments
  - [ ] Automated testing on PRs

### Observability
- [ ] **Monitoring and logging**
  - [ ] Request logging middleware
  - [ ] Health check endpoints
  - [ ] Error tracking and alerting
  - [ ] Performance monitoring

### Performance
- [ ] **Performance optimization**
  - [ ] Database query optimization
  - [ ] Frontend bundle size analysis
  - [ ] Caching strategies
  - [ ] CDN setup (future)

### Security
- [ ] **Security hardening**
  - [ ] Rate limiting
  - [ ] CORS configuration
  - [ ] Security headers
  - [ ] Input sanitization audit

**Acceptance Criteria for Phase 4:**
- [ ] CI/CD pipeline deploys on successful builds
- [ ] Application performance meets targets (< 2s load time)
- [ ] Security audit passes
- [ ] Monitoring alerts are configured

---

## Quick Wins (Can be done immediately)

- [ ] Fix ESLint configuration (root-level config)
- [ ] Create `.env.example` file
- [ ] Add basic error boundaries to React app
- [ ] Set up basic logging
- [ ] Add API health check endpoint
- [ ] Create basic README with setup instructions

---

*Last updated: 2025-01-29*
