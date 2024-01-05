import dotenv from 'dotenv'
import path from 'path'

// Load env vars based on NODE_ENV
const envFile = process.env.NODE_ENV === 'stage' ? '.env.stage' : '.env'
dotenv.config({ path: path.resolve(process.cwd(), envFile) })

import app from './app'

const port = process.env.DDEX_PORT || 8926

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`)
})
