import { Request, Response } from 'express'
import { z } from 'zod'
import { Logger } from 'pino'
import { getIP, getIpData } from '../../utils/ipData'
import { connections } from '../../utils/connections'

export type LocationData = { city: string, region: string, country: string} | {}

export const recordListenBodySchema = z.object({
    userId: z.string(),
})

export const recordListenParamsSchema = z.object({
    // validate that it can parse as an int
    trackId: z.string().transform((s) => parseInt(s)).refine((val) => !isNaN(val), {
        message: "trackId must be a numeric string",
      }).transform((val) => val.toString()),
})

export interface RecordListenRequest extends Request {
    body: z.infer<typeof recordListenBodySchema>;
    params: z.infer<typeof recordListenParamsSchema>;
  }

export type RecordListenParams = {
    logger: Logger
    trackId: string
    userId: string
    ip: string
}

export type RecordListenResponse = {
    solTxSignature: string | null
}

export const recordListen = async (params: RecordListenParams): Promise<RecordListenResponse> => {
    const { logger, userId, trackId, ip } = params

    logger.info({ ip }, "record listen")

    const connection = connections[0]

    const location = await getIpData(logger, ip)

    logger.info({ location }, "location")

    return { solTxSignature: null }
}

export const listen = async (req: Request, res: Response) => {
    try {
        // validation
        const { userId } = recordListenBodySchema.parse(req.body)
        const { trackId } = recordListenParamsSchema.parse(req.params)
        const logger = res.locals.logger.child({ userId, trackId })
        const ip = getIP(req)

        // record listen after validation
        const record = await recordListen({ userId, trackId, logger, ip })
        return res.status(200).json(record)
    } catch (e: unknown) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation Error', errors: e.errors });
        }
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
