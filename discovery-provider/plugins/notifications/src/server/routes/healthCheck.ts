import { Router, Request, Response } from 'express'
import { config } from '../../config'
import { getRedisConnection } from '../../utils/redisConnection'

// Mapped to the /health_check Endpoint
const router = Router()

router.get('/', async (req: Request, res: Response) => {
  const redis = await getRedisConnection()
  const lastIndexedMessageRedisKey = await redis.get(
    config.lastIndexedMessageRedisKey
  )
  const lastIndexedReactionRedisKey = await redis.get(
    config.lastIndexedReactionRedisKey
  )
  res.json({
    healthy: true,
    poll: config.pollInterval,
    dmNotificationDelay: config.dmNotificationDelay,
    lastIndexedMessageRedisKey,
    lastIndexedReactionRedisKey
  })
})

export { router }
