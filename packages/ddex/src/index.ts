import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 8926;

// TODO: Add /api/* routes here.
// We can add middleware to init SDK with secrets and whatnot, and persist it on `app` for future requests. This runs on a node, so it can just access the environment directly.
app.get('/api/health_check', (req: Request, res: Response) => {
  res.status(200).send('DDEX is alive!');
});

// Serve static files from the React frontend
const isProduction = process.env.NODE_ENV === 'production';
const buildPath = isProduction
  ? path.join(__dirname, '..', 'public') // In prod (Docker), serve from 'public'
  : path.join(__dirname, '..', '..', 'ddex-frontend', 'dist'); // In dev, serve from '../ddex-frontend/dist'
app.use(express.static(buildPath));

app.get("/", (req: Request, res: Response) => {
  // Send the React app for the root route
  res.sendFile(path.join(buildPath, 'index.html'));
});

// Fallback route for handling client-side routing
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
