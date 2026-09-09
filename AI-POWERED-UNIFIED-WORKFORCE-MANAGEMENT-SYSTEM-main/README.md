# Workforce OS

Foundation for the AI-powered unified workforce management system.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Available scripts

- `npm run dev` starts the development server with Turbopack.
- `npm run build` creates a production build.
- `npm run start` serves the production build.
- `npm run lint` runs ESLint.

## BACKEND / API

The project now includes a server-side API layer built with Next.js App Router route handlers and Supabase access from the server environment. The backend is intentionally lightweight and keeps the app logic in reusable helpers instead of duplicating database access across routes.

### Health check

- `GET /api/health`

Response:

```json
{
  "success": true,
  "message": "AI Workforce Management System API is running"
}
```

### Implemented APIs

- `GET /api/employees`
- `POST /api/employees`
- `GET /api/employees/[id]`
- `PUT /api/employees/[id]`
- `DELETE /api/employees/[id]`
- `GET /api/candidates`
- `POST /api/candidates`
- `GET /api/candidates/[id]`
- `PUT /api/candidates/[id]`
- `DELETE /api/candidates/[id]`
- `GET /api/interviews`
- `POST /api/interviews`
- `GET /api/interviews/[id]`
- `PUT /api/interviews/[id]`
- `DELETE /api/interviews/[id]`
- `GET /api/requests`
- `POST /api/requests`
- `GET /api/requests/[id]`
- `PUT /api/requests/[id]`
- `GET /api/tasks`
- `POST /api/tasks`
- `PUT /api/tasks/[id]`
- `GET /api/notifications`
- `PUT /api/notifications/[id]`
- `GET /api/activities`

### Authentication and role checks

The server-side auth helper loads the current Supabase session, resolves the authenticated user, fetches the matching `public.profiles` row, and returns the profile role. Role checks use a small set of helper functions so route handlers can quickly enforce authority without heavy middleware.

Supported roles:

- `ADMIN`
- `HR`
- `EMPLOYEE`
- `CANDIDATE`

The API uses a consistent response pattern:

```json
{ "success": true, "data": [...] }
```

and for failures:

```json
{ "success": false, "message": "Employee not found" }
```

### Supabase database access

The backend uses the existing server-side Supabase client from `src/lib/supabase/server.ts` and keeps the public anon key only in environment variables. No service-role credentials or secrets are exposed to client components. The app uses the existing database tables declared in `database/schema.sql`; no new database recreation is performed.

### API response format

All routes return a consistent JSON structure, with HTTP status codes used for validation and access control such as:

- `400` for invalid request payloads
- `401` for unauthenticated requests
- `403` for unauthorized access
- `404` for missing records
- `500` for server or database errors

## Database setup

The database foundation uses Supabase PostgreSQL. The application is not connected until local environment variables are configured.

1. Create a Supabase project.
2. Open the Supabase SQL Editor.
3. Run `database/schema.sql`.
4. Run `database/seed.sql`.
5. Copy the Supabase URL and anon key into a local `.env.local` file using `.env.example` as the template.
6. Start the Next.js application with `npm run dev`.

The project includes reusable browser and server Supabase clients in `src/lib/supabase/`. Only the public anon key is expected; service-role credentials are not used by this foundation.

## Authentication setup

Authentication uses Supabase Auth with email and password. The application does not include public registration or store passwords in the database.

1. Create or open the Supabase project used for this workspace.
2. In Project Settings, copy the project URL.
3. Copy the anon/publishable key.
4. Add both values to a local `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

5. In Supabase Authentication, enable email/password sign-in.
6. Create test users in the Supabase Authentication dashboard.
7. Create a matching row in `public.profiles` for each user, using the Auth user ID as `profiles.id` and assigning one of `ADMIN`, `HR`, `EMPLOYEE`, or `CANDIDATE`.
8. Start the application with `npm run dev` and open `/login`.

When the environment variables are absent, the login page shows a setup message and protected pages do not claim that authentication is connected. No real credentials belong in this repository.