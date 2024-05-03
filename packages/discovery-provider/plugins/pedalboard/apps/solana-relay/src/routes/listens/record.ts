import { Response } from 'express'
import { z } from 'zod'
import { getIP } from '../../utils'
import { LocationData, RecordListenParams, RecordListenRequest, recordListenBodySchema, recordListenParamsSchema } from './types'
import { config } from '../../config'
import axios from 'axios'
import { getLibs } from '../../sdk'
import { createTrackListenInstructions, getFeePayerKeypair } from './solana'

// handler for recording a listen that catches all errors and returns correct response
export const listenHandler = async (req: RecordListenRequest, res: Response) => {
    try {
        // validation
        const { userId } = recordListenBodySchema.parse(req.body)
        const { trackId } = recordListenParamsSchema.parse(req.params)
        const logger = res.locals.logger.child({ userId, trackId })
        const ip = getIP(req)

        // record listen after validation
        await recordListen({ userId, trackId, logger, ip })
    } catch (e: unknown) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation Error', errors: e.errors });
        }
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

// validates and records a track listen, throws in the event of an error
// any throws in here should be considered 500s as we've passed validation
export const recordListen = async (params: RecordListenParams) => {
    const { logger, userId, trackId, ip } = params

    logger.info({ ip }, "TrackListen tx submission")

    const url = `https://api.ipdata.co/${ip}?api-key=${config.ipdataApiKey}`
    const location: LocationData = await axios.get(url)
        .then(({ data: { city, region, country_name} }: { data: { city: string, region: string, country_name: string}}) => {
            return { city, region, country: country_name }
        })
        .catch((e) => {
            logger.error({ error: e }, "TrackListen fetch failed")
            return {}
        })

    const libs = await getLibs()
    const connection = libs.solanaWeb3Manager?.getConnection()
    if (!connection) throw new Error("solana connection not available")

    const instructions = await createTrackListenInstructions({
        userId,
        trackId,
        source: "",
        privateKey: "",
        location,
        connection
    })

    const feePayer = getFeePayerKeypair(false)

    const transactionHandler = libs.solanaWeb3Manager?.transactionHandler
    const txResponse = await transactionHandler?.handleTransaction({
        instructions,
        skipPreflight: false,
        feePayerOverride: feePayer,
        retry: true,
    })

    if (!txResponse) throw new Error("txResponse undefined")

    const { res: solTxSignature, error } = txResponse

    if (error) {
        logger.error({ error }, "TrackListen confirmation error")
        throw new Error(error)
    }

    // send response with signature
    logger.info({ solTxSignature }, "TrackListen recorded")
}
