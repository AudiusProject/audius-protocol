import { expect, jest, test } from '@jest/globals'
import { Processor } from '../main'
import * as sns from '../sns'
import { getRedisConnection } from '../utils/redisConnection'
import { config } from '../config'
import {
    createTestDB,
    replaceDBName,
    dropTestDB
} from '../utils/populateDB'

export const setUpTestDbProcessor = async () => {
    const testName = expect.getState().currentTestName.replace(/\s/g, '_').toLocaleLowerCase()
    await Promise.all([
        createTestDB(process.env.DN_DB_URL, testName),
        createTestDB(process.env.IDENTITY_DB_URL, testName)
    ])
    const redis = await getRedisConnection()
    redis.del(config.lastIndexedMessageRedisKey)
    redis.del(config.lastIndexedReactionRedisKey)
    let processor = new Processor()
    await processor.init({
        identityDBUrl: replaceDBName(process.env.IDENTITY_DB_URL, testName),
        discoveryDBUrl: replaceDBName(process.env.DN_DB_URL, testName),
    })
    return processor
}

export const resetTests = async (processor) => {
    jest.clearAllMocks()
    await processor?.close()
    const testName = expect.getState().currentTestName.replace(/\s/g, '_').toLocaleLowerCase()
    await Promise.all([
        dropTestDB(process.env.DN_DB_URL, testName),
        dropTestDB(process.env.IDENTITY_DB_URL, testName),
    ])
}