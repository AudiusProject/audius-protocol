import { Router } from 'express'

// Mapped to the /health_check Endpoint
const router = Router()

router.get('/', async (req, res) => {
  res.json({
    healthy: true
  })
})

export { router }
