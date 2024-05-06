import { Response } from 'express'
import { z } from 'zod'
import { getIP } from '../../utils'
import { LocationData, RecordListenParams, RecordListenRequest, RecordListenResponse, recordListenBodySchema, recordListenParamsSchema } from './types'
import { config } from '../../config'
import axios from 'axios'
import { createTrackListenInstructions, getFeePayerKeypair } from '../../legacy/solana-client'
import { Logger } from 'pino'
import { getConnection } from '../../connections'
import { sendTransactionWithRetries } from '../relay/relay'

// handler for recording a listen that catches all errors and returns correct response
export const listenHandler = async (req: RecordListenRequest, res: Response) => {
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

// validates and records a track listen, throws in the event of an error
// any throws in here should be considered 500s as we've passed validation
export const recordListen = async (params: RecordListenParams): Promise<RecordListenResponse> => {
    const { logger, userId, trackId, ip } = params

    logger.info({ ip }, "record listen")

    const connection = getConnection()

    const location = await getIpData(logger, ip)

    logger.info({ location }, "location")

    const [secpInstruction, listenInstruction] = await createTrackListenInstructions({
        privateKey: config.ethValidSigner,
        userId,
        trackId,
        source: "relay",
        location,
        connection
    })

    logger.info({ secpInstruction, listenInstruction }, "instructions")

    const feePayer = await getFeePayerKeypair(false)

    logger.info({ feePayer }, "feePayer")

    // await sendTransactionWithRetries({
    //     transaction: secpInstruction,

    // })


    // logger.info({ txResponse }, "txResponse")

    // if (!txResponse) throw new Error("txResponse undefined")

    // const { res: solTxSignature, error } = txResponse

    // if (error) {
    //     logger.error({ error }, "TrackListen confirmation error")
    //     throw new Error(error)
    // }

    // // send response with signature
    // logger.info({ solTxSignature }, "TrackListen recorded")
    return { solTxSignature: null }
}

const getIpData = async (logger: Logger, ip: string): Promise<LocationData> => {
    const ipdataApiKey = config.ipdataApiKey
    if (ipdataApiKey === null) return {}
    const url = `https://api.ipdata.co/${ip}?api-key=${config.ipdataApiKey}`
    try {
        const response = await axios.get(url)
        .then(({ data: { city, region, country_name} }: { data: { city: string, region: string, country_name: string}}) => {
            return { city, region, country: country_name }
        })
        return response
    } catch (e: unknown) {
        logger.error({ error: e }, "TrackListen fetch failed")
        return {}
    }
}
