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