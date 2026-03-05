# BlackOps Pro - Pure PostgreSQL Setup

## Overview
BlackOps Pro is a Next.js application with pure PostgreSQL authentication and data management. No Supabase dependencies - everything runs on your local PostgreSQL 18 database.

## Tech Stack
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL 18 (via PgAdmin 4)
- **Authentication**: JWT tokens with HTTP-only cookies
- **Password Hashing**: bcryptjs

## Database Setup

### Prerequisites
- PostgreSQL 18 installed
- PgAdmin 4 for database management
- Node.js and npm

### Database Configuration
1. Create a database named `blackopspro` in PgAdmin 4
2. The application will automatically create the required tables on first run

### Environment Variables
Create a `.env.local` file in the project root:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/blackopspro
JWT_SECRET=your-very-secure-secret-key-change-in-production-make-it-at-least-32-characters
```

**Important**: Change `JWT_SECRET` to a secure random string in production!

## Database Schema

The app automatically creates these tables:

### users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### organizations
```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

Indexes are automatically created for performance.

## Installation & Running

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables** (see above)

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Access the app**:
   - Open http://localhost:3000
   - First run will create database tables automatically

## Authentication Flow

1. **Registration**: User signs up → Password hashed with bcrypt → JWT token created → Stored in HTTP-only cookie
2. **Login**: Email/password verified → JWT token created → Cookie set
3. **Protected Routes**: `requireAuth()` checks JWT token from cookie → Redirects to login if invalid
4. **Logout**: JWT cookie cleared

## API Endpoints

- `POST /api/login` - User login
- `POST /api/signup` - User registration
- `POST /api/logout` - User logout

All endpoints handle JWT token management automatically.

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   │   ├── login/
│   │   ├── signup/
│   │   └── logout/
│   ├── (auth)/        # Auth pages
│   │   ├── login/
│   │   └── signup/
│   ├── org/           # Protected org page
│   ├── layout.tsx     # Root layout
│   ├── page.tsx       # Dashboard
│   └── globals.css    # Tailwind styles
├── lib/
│   ├── auth.ts        # Authentication functions
│   ├── jwt.ts         # JWT utilities
│   ├── db.ts          # Database connection & queries
│   ├── org.ts         # Organization data functions
│   ├── components/    # Reusable components
│   └── types/         # TypeScript types
```

## Key Features

- ✅ **Pure PostgreSQL** - No external services
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Automatic DB Setup** - Tables created on first run
- ✅ **TypeScript** - Full type safety
- ✅ **Tailwind CSS** - Modern styling
- ✅ **Server-Side Rendering** - Fast, SEO-friendly

## Security Notes

- Passwords are hashed with bcrypt (10 rounds)
- JWT tokens are HTTP-only cookies
- Database queries use parameterized statements
- UUID primary keys for security
- CORS and other security headers handled by Next.js

## Development

- Run `npm run lint` for code quality checks
- Database tables are created automatically - no migrations needed
- All authentication is server-side only
- Client components never access database directly

## Production Deployment

1. Set secure `JWT_SECRET` (32+ characters)
2. Configure production PostgreSQL database
3. Set `NODE_ENV=production`
4. Use HTTPS for cookie security
5. Consider rate limiting on auth endpoints

## Troubleshooting

**Database connection issues**:
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check user permissions in PgAdmin

**JWT token issues**:
- Verify `JWT_SECRET` is set
- Check cookie settings in browser dev tools
- Tokens expire after 7 days by default

**Table creation fails**:
- Ensure database user has CREATE permissions
- Check PostgreSQL logs for errors
- Manually create tables if auto-creation fails

---

**Built with ❤️ using Next.js and PostgreSQL**
