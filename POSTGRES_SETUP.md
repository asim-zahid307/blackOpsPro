# PostgreSQL Authentication Setup Guide

This project has been migrated from Supabase to a self-hosted PostgreSQL database with JWT-based authentication.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 12+ installed and running
- npm or yarn package manager

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

This installs the new PostgreSQL client (`pg`), password hashing (`bcryptjs`), and JWT utilities (`jsonwebtoken`).

### 2. Set Up Your PostgreSQL Database

#### Option A: Using the Setup Script (Recommended)

First, create a PostgreSQL database:

```bash
# Using psql command line
createdb black_ops_pro
```

Update your `.env.local` with the correct connection string:

```
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/black_ops_pro
```

Then run the setup script:

```bash
node setup-db.js
```

This will automatically create the required tables (`users` and `organizations`).

#### Option B: Manual Setup

1. Create a database named `black_ops_pro`
2. Connect to the database
3. Copy and run the SQL from `supabase/migrations/001_initial_schema.sql`

### 3. Configure Environment Variables

Update `.env.local`:

```env
# PostgreSQL Database URL
DATABASE_URL=postgresql://username:password@localhost:5432/black_ops_pro

# JWT Secret (change this in production!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# JWT Expiry
JWT_EXPIRY=7d

# Node Environment
NODE_ENV=development
```

**⚠️ Important:** In production, use a strong, randomly generated JWT_SECRET.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## What Changed

### Removed Supabase Dependencies

- `@supabase/auth-helpers-nextjs`
- `@supabase/ssr`
- `@supabase/supabase-js`

### Added Dependencies

- `pg`: PostgreSQL client for Node.js
- `bcryptjs`: Password hashing
- `jsonwebtoken`: JWT token creation and verification
- Type definitions for the above

### New Files Created

- `src/lib/db.ts`: PostgreSQL connection and query utilities
- `src/lib/jwt.ts`: JWT token creation, verification, and cookie management
- `src/app/api/auth/login/route.ts`: Login API endpoint
- `src/app/api/auth/signup/route.ts`: Signup API endpoint
- `src/app/api/auth/logout/route.ts`: Logout API endpoint
- `supabase/migrations/001_initial_schema.sql`: Database schema
- `setup-db.js`: Database setup script

### Modified Files

- `package.json`: Updated dependencies
- `src/lib/auth.ts`: Replaced Supabase auth with JWT verification
- `src/lib/org.ts`: Direct PostgreSQL queries instead of Supabase client
- `src/app/(auth)/login/page.tsx`: Uses new login API endpoint
- `src/app/(auth)/signup/page.tsx`: Uses new signup API endpoint
- `src/lib/components/LogoutButton.tsx`: Uses new logout API endpoint
- `.env.local` & `.env.example`: Updated environment variables

### Removed Files (Safe to Delete)

The following directories can be removed if not needed:
- `src/lib/supabase/` - No longer used

## Authentication Flow

### Login

1. User submits email and password on `/login`
2. Client calls `POST /api/auth/login`
3. API verifies credentials against `users` table
4. JWT token is created and set in `auth-token` httpOnly cookie
5. User is redirected to `/org`

### Signup

1. User submits email and password on `/signup`
2. Client calls `POST /api/auth/signup`
3. API creates new user record with hashed password
4. JWT token is created and set in cookie
5. User is redirected to `/login`

### Protected Routes

Protected routes use `requireAuth()` from `src/lib/auth.ts`:

```typescript
import { requireAuth } from '@/lib/auth';

export default async function ProtectedPage() {
    const user = await requireAuth(); // Redirects to /login if not authenticated
    
    return <div>Hello {user.email}</div>;
}
```

## Database Schema

### users table

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| email | VARCHAR(255) | Unique, indexed |
| password_hash | VARCHAR(255) | bcrypt hashed password |
| created_at | TIMESTAMP | Auto-set on creation |
| updated_at | TIMESTAMP | Auto-set on creation |

### organizations table

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Organization name |
| user_id | UUID | Foreign key to users.id |
| created_at | TIMESTAMP | Auto-set on creation |
| updated_at | TIMESTAMP | Auto-set on creation |

## Troubleshooting

### "ECONNREFUSED" when trying to connect to database

- Make sure PostgreSQL is running
- Verify the DATABASE_URL is correct
- Check username and password are correct

### "relation 'users' does not exist"

- Run `node setup-db.js` to create the schema
- Or manually run the SQL in `supabase/migrations/001_initial_schema.sql`

### "Invalid email or password" on login despite correct credentials

- Ensure the user exists in the `users` table
- Check that the password was hashed correctly when the account was created
- Try resetting by deleting the user and creating a new account

## Security Considerations

1. **JWT_SECRET**: Change this to a strong random value in production
2. **HTTPS**: Always use HTTPS in production
3. **Cookies**: Auth tokens are stored in httpOnly cookies (secure against XSS)
4. **Password Hashing**: Passwords are hashed with bcrypt
5. **CORS**: Configure CORS appropriately for your API endpoints

## Adding More Organizations

To add organizations for a user, insert into the `organizations` table:

```sql
INSERT INTO organizations (name, user_id) 
VALUES ('My Org', 'user-id-here');
```

Or use the query function from `src/lib/db.ts`:

```typescript
import { query } from '@/lib/db';

await query(
    'INSERT INTO organizations (name, user_id) VALUES ($1, $2)',
    ['My Org', userId]
);
```

## Extending the User Model

To add more fields to the `users` table (e.g., first_name, last_name):

1. Create a new migration file in `supabase/migrations/`
2. Run the migration
3. Update the `User` interface in `src/lib/auth.ts` if needed

Example migration:

```sql
-- supabase/migrations/002_add_user_fields.sql
ALTER TABLE users ADD COLUMN first_name VARCHAR(100);
ALTER TABLE users ADD COLUMN last_name VARCHAR(100);
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);
```

## Production Deployment

1. Set a strong `JWT_SECRET` in your production environment
2. Use a managed PostgreSQL service (AWS RDS, DigitalOcean, etc.)
3. Enable HTTPS
4. Set `NODE_ENV=production`
5. Consider adding rate limiting to auth endpoints
6. Set up database backups

## Need Help?

Refer to the documentation:
- PostgreSQL: https://www.postgresql.org/docs/
- Next.js: https://nextjs.org/docs
- JWT: https://jwt.io/
- bcryptjs: https://github.com/dcodeIO/bcrypt.js

