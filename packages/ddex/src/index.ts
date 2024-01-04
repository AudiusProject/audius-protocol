import app from './app';
import dotenv from 'dotenv';

dotenv.config();
const port = process.env.DDEX_PORT || 8926;

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
