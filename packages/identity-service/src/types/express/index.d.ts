import Logger from 'bunyan'

export {}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        walletAddress?: string
        handle: string
        blockchainUserId: number
      }
      logger: Logger
    }
  }
}
