import { Request, Response } from 'express'
import { z } from 'zod'
import { Logger } from 'pino'

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
