/**
 * Vercel catch-all serverless entry point for every /api/* request.
 * The existing Express application owns the actual routes.
 */
import app from '../server';

export default app;
