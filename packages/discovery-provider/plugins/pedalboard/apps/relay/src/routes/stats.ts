import { RedisClientType } from "@redis/client";
import { NextFunction, Request, Response } from "express";
import { scanWithPrefix } from "../redis";

export type RelayStats = {
    successes: number
    failures: number
    successRate: number | null
    totalCalls: number
}

export const statsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
    const successes = 300
    const failures = 40
    const totalCalls = successes + failures
    const successRate = Math.floor((successes / totalCalls) * 100)

    const stats: RelayStats = {
        successes,
        failures,
        successRate,
        totalCalls
    }
  res.send(stats);
  next();
};

/** redis utilities to manage successes and failures */
const relayStatsKey = "relay:stats"
let statsScanLock = false // doesn't let more than one scan run at once
const oneDaySeconds = 86400
const successKeyPrefix = "relay:success:"
const failureKeyPrefix = "relay:failure:"
const successKey = (requestid: string) => `${successKeyPrefix}${requestid}`
const failureKey = (requestid: string) => `${failureKeyPrefix}${requestid}`

type RecordedTransaction = {
    // hash may not be present in a 500 request
    hash?: string
    encodedABI: string
    requestId: string
}

const recordRelaySuccess = async (redis: RedisClientType, tx: RecordedTransaction) => {
    const { requestId } = tx
    const key = successKey(requestId)
    const value = JSON.stringify(tx)
    // record tx and expire in 24 hours
    await redis.set(key, value, { EX: oneDaySeconds })
}

const recordRelayFailure = async (redis: RedisClientType, tx: RecordedTransaction) => {
    const { requestId } = tx
    const key = failureKey(requestId)
    const value = JSON.stringify(tx)
    // record tx and expire in 24 hours
    await redis.set(key, value, { EX: oneDaySeconds })
}

const retrieveRelaySuccesses = async (): Promise<RecordedTransaction[]> => {
    return await scanWithPrefix<RecordedTransaction>(successKeyPrefix)
}

const retrieveRelayFailures = async (): Promise<RecordedTransaction[]> => {
    return await scanWithPrefix<RecordedTransaction>(failureKeyPrefix)
}

const retrieveRelayStats = async (redis: RedisClientType): Promise<RelayStats> => {
    const stats = await redis.get(relayStatsKey)
    if (stats === null) {
        // evaluate stats and persist again
        return cacheRelayStats(redis)
    }
    return JSON.parse(stats)
}

const cacheRelayStats = async (redis: RedisClientType): Promise<RelayStats> => {
    const stats = await countRelayStats()
    await redis.set(relayStatsKey, JSON.stringify(stats))
    return stats
}

const countRelayStats = async (): Promise<RelayStats> => {
    const successes = await retrieveRelaySuccesses()
    const failures = await retrieveRelayFailures()

    const totalSuccesses = successes.length
    const totalFailures = failures.length
    const totalCalls = totalSuccesses + totalFailures
    const successRate = Math.floor((totalSuccesses / totalCalls) * 100)

    return {
        successes: totalSuccesses,
        failures: totalFailures,
        totalCalls,
        successRate
    }
}
