# PawPa Backend API

PawPa pet care mobile application backend server built with Node.js, Express, TypeScript, and SQLite.

## Features

- **Express.js** REST API server
- **TypeScript** for type safety
- **Drizzle ORM** with SQLite database
- **Security middleware** (Helmet, CORS, Rate Limiting)
- **Request validation** with Zod
- **Error handling** and logging
- **Health check** endpoints
- **Database migrations** with Drizzle Kit

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pawpa-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
npm run db:migrate
```

5. Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Apply database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio for database management
- `npm run db:reset` - Reset database and reapply migrations

## API Endpoints

### Health Check
- `GET /health` - Server health status
- `GET /api` - API information and available endpoints

### Pets (Coming in Phase 2)
- `GET /api/pets` - List all pets
- `GET /api/pets/:id` - Get pet details
- `POST /api/pets` - Create new pet
- `PUT /api/pets/:id` - Update pet
- `DELETE /api/pets/:id` - Delete pet

### Health Records (Coming in Phase 2)
- `GET /api/pets/:petId/health-records` - Get pet health records
- `POST /api/health-records` - Create health record
- `PUT /api/health-records/:id` - Update health record
- `DELETE /api/health-records/:id` - Delete health record

### Events (Coming in Phase 2)
- `GET /api/pets/:petId/events` - Get pet events
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Feeding Schedules (Coming in Phase 2)
- `GET /api/pets/:petId/feeding-schedules` - Get feeding schedules
- `POST /api/feeding-schedules` - Create feeding schedule
- `PUT /api/feeding-schedules/:id` - Update feeding schedule
- `DELETE /api/feeding-schedules/:id` - Delete feeding schedule

## Project Structure

```
src/
├── controllers/     # API route handlers
├── routes/         # Route definitions
├── services/       # Business logic
├── models/         # Drizzle schema definitions
├── middleware/     # Custom middleware
├── utils/          # Helper functions
├── config/         # Configuration files
├── app.ts          # Express app configuration
└── index.ts        # Server entry point
```

## Environment Variables

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)
- `DATABASE_URL` - SQLite database file path
- `CORS_ORIGIN` - Allowed CORS origin
- `RATE_LIMIT_WINDOW_MS` - Rate limit time window
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window

## Database Schema

The application uses SQLite with the following main tables:

- **pets** - Pet information
- **health_records** - Health and medical records
- **events** - Scheduled events and activities
- **feeding_schedules** - Recurring feeding schedules

## Error Handling

All API responses follow a consistent format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

## Development

### Database Management

Use Drizzle Kit for database operations:

```bash
# Generate migration files
npm run db:generate

# Apply migrations
npm run db:migrate

# View and edit database
npm run db:studio
```

### Adding New Endpoints

1. Define schemas in `src/models/schema.ts`
2. Create controllers in `src/controllers/`
3. Define routes in `src/routes/`
4. Add middleware as needed in `src/middleware/`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC License