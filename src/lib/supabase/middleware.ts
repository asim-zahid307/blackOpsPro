// Server-side authentication utilities
// NOTE: Authentication is now handled via requireAuth() in server components
// This file is kept for future server-side session management if needed

export const authConfig = {
    // Protected routes that require authentication
    protectedRoutes: ["/", "/org"],

    // Auth pages that should redirect authenticated users
    authPages: ["/login", "/signup"],
};


