import type { AudiusLibs } from '@audius/sdk'
import type Logger from 'bunyan'

export const waitForUser = async ({
  userId,
  handle,
  blockNumber: blocknumber,
  audiusLibsInstance,
  logger
}: {
  userId: number
  handle: string
  blockNumber: number
  audiusLibsInstance: AudiusLibs
  logger: Logger
}) => {
  let retryCount = 0
  while (retryCount < 10) {
    try {
      logger.info({ userId, handle, blocknumber }, 'req')
      const u = await audiusLibsInstance.discoveryProvider!._makeRequest<
        {
          handle: string
        }[]
      >(
        {
          endpoint: 'users',
          queryParams: { id: userId }
        },
        true,
        0,
        true,
        blocknumber
      )
      if (!u || !u[0]) {
        throw new Error('User not found')
      }
      return u[0]
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('Requested blocknumber')) {
        logger.warn(
          { blocknumber, handle, userId, retryCount },
          'Block number not passed... waiting...'
        )
        await new Promise((resolve) => setTimeout(resolve, 500))
        retryCount++
        continue
      }
      throw e
    }
  }
}
