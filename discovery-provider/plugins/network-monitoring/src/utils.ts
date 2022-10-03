
import Web3 from 'web3';
const web3 = new Web3()


import type { AxiosResponse } from 'axios';
import axios from 'axios';
import * as http from 'http';
import * as https from 'https';
import retry from 'async-retry';
import { instrumentTracing, tracing } from './tracer';

// const UnhealthyTimeRangeMs = 1_800_000 // 30min
const UnhealthyTimeRangeMs = 300_000 // 5min
const unhealthyNodes: Record<string, number> = {}

axios.defaults.timeout = 300_000 // 5min
axios.defaults.httpAgent = new http.Agent({ timeout: 60000 })
axios.defaults.httpsAgent = new https.Agent({ timeout: 60000, rejectUnauthorized: false })

const _makeRequest = async (
    request: {
        baseURL: string,
        url: string
    },
    retries: number,
    log: boolean,
    deregisteredCN: string[],
    additionalInfo: object,
): Promise<{
    response?: AxiosResponse<any, any>,
    attemptCount: number,
    canceled: boolean,
}> => {
    const additionalInfoMsg = (additionalInfo) ? ` ${JSON.stringify(additionalInfo)}` : ''

    const endpoint = request.baseURL
    const fullURL = `${endpoint}${request.url}`

    // Exit early to avoid wasting time on a deregistered node
    if (deregisteredCN.includes(endpoint)) {
        tracing.info(`[makeRequest] Skipping request to ${endpoint} since it has been deregistered`)

        return { attemptCount: 0, canceled: true }
    }

    // Exit early to avoid wasting time on a node recently marked unhealthy
    if (nodeRecentlyMarkedUnhealthy(endpoint)) {
        tracing.info(`[makeRequest] Skipping request to ${endpoint} since it was recently confirmed unhealthy`)
        return { attemptCount: 0, canceled: true }
    }

    const startMs = Date.now()
    let attemptCount = 1
    try {
        const response = await retry(
            async () => axios(request),
            {
                retries,
                factor: 4,
                minTimeout: 30_000,
                onRetry: (e: Error) => {
                    attemptCount++
                    tracing.debug(`\t[makeRequest Retrying] (${fullURL}) - ${attemptCount} attempts - Error ${e.message} - ${logDuration(Date.now() - startMs)}${additionalInfoMsg}`)
                }
            }
        )
        if (log) tracing.debug(`\t[makeRequest Success] (${fullURL}) - ${attemptCount} attempts - ${logDuration(Date.now() - startMs)}${additionalInfoMsg}`)
        return { response, attemptCount, canceled: false }
    } catch (e: any) {
        // mark node as unhealthy to speed up future processing
        tracing.recordException(e)
        tracing.info(`\t[makeRequest] Adding ${endpoint} to unhealthyNodes at ${Date.now()}`)
        unhealthyNodes[endpoint] = Date.now()

        const errorMsg = `[makeRequest Error] (${fullURL}) - ${attemptCount} attempts - ${logDuration(Date.now() - startMs)}${additionalInfoMsg} - ${e.message}`
        tracing.error(`\t${errorMsg}`)
        throw new Error(`${errorMsg}`)
    }
}

export const makeRequest = instrumentTracing({
    fn: _makeRequest,
})

const _generateSPSignatureParams = (signatureSpID: number, signatureSPDelegatePrivateKey: string) => {
    const { timestamp, signature } = generateTimestampAndSignature(
        { spID: signatureSpID },
        signatureSPDelegatePrivateKey
    )

    return {
        spID: signatureSpID,
        timestamp: timestamp,
        signature: signature
    }
}

export const generateSPSignatureParams = instrumentTracing({
    fn: _generateSPSignatureParams,
})

/**
 * Generate the timestamp and signature for api signing
 * @param {object} data
 * @param {string} privateKey
 */
const _generateTimestampAndSignature = (data: object, privateKey: string) => {
    const timestamp = new Date().toISOString()
    const toSignObj = { ...data, timestamp }
    // JSON stringify automatically removes white space given 1 param
    const toSignStr = JSON.stringify(sortObj(toSignObj))
    const toSignHash = web3.utils.keccak256(toSignStr)
    const signedResponse = web3.eth.accounts.sign(toSignHash, privateKey)

    return { timestamp, signature: signedResponse.signature }
}

export const generateTimestampAndSignature = instrumentTracing({
    fn: _generateTimestampAndSignature,
})

/**
 * used to track unhealthy nodes and avoid frequent repeated requests to speed up processing
 */

const _nodeRecentlyMarkedUnhealthy = (endpoint: string) => {
    if (!(endpoint in unhealthyNodes)) {
        return false
    }

    return ((Date.now() - unhealthyNodes[endpoint]!) <= UnhealthyTimeRangeMs)
}

export const nodeRecentlyMarkedUnhealthy = instrumentTracing({
    fn: _nodeRecentlyMarkedUnhealthy,
})


// Appends suffixes to log msg based on duration, for easy log parsing
export const logDuration = (duration: number) => {
    let msg = `${duration}ms`
    if (duration > 10000) msg += ' Took 10+s'
    if (duration > 30000) msg += ' Took 30+s'
    if (duration > 50000) msg += ' Took 50+s'
    if (duration > 100000) msg += ' Took 100+s'
    return msg
}

// Sort object by its keys
export const sortObj = (obj: Record<any, any>) => {
    return Object.keys(obj).sort().reduce((result: Record<any, any>, key: string) => {
        result[key] = obj[key];
        return result;
    }, {});
}

export const asyncSleep = (milliseconds: number) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}
