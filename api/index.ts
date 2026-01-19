import { type Request, Response, NextFunction } from "express";
import express from "express";
import { registerRoutes } from "../server/routes";
import session from "express-session";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'sweetbite-bakery-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Initialize routes lazily
let routesRegistered = false;

export default async function handler(req: Request, res: Response) {
    if (!routesRegistered) {
        await registerRoutes(app);

        // Error handler
        app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
            const status = err.status || err.statusCode || 500;
            const message = err.message || "Internal Server Error";
            res.status(status).json({ message });
        });

        routesRegistered = true;
    }

    // Forward request to express app
    return app(req, res);
}
