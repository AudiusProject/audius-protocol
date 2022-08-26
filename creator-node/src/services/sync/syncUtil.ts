import type Logger from 'bunyan'

import axios from 'axios'
import _ from 'lodash'

const asyncRetry = require('../../utils/asyncRetry')

const EXPORT_REQ_TIMEOUT_MS = 10000 // 10000ms = 10s
const EXPORT_REQ_MAX_RETRIES = 3

type ExportQueryParams = {
  wallet_public_key: string
  clock_range_min: number
  force_export: boolean
  source_endpoint?: string
}
type FetchExportParams = {
  nodeEndpointToFetchFrom: string
  wallet: string
  clockRangeMin: number
  selfEndpoint?: string
  logger: Logger
  forceExport: boolean
}
type FetchExportOutput = {
  fetchedCNodeUser?: any
  error?: {
    message: string
    code: 'failure_export_wallet' | 'failure_malformed_export'
  }
}

async function fetchExportFromNode({
  nodeEndpointToFetchFrom,
  wallet,
  clockRangeMin,
  selfEndpoint,
  logger,
  forceExport = false
}: FetchExportParams): Promise<FetchExportOutput> {
  const exportQueryParams: ExportQueryParams = {
    wallet_public_key: wallet,
    clock_range_min: clockRangeMin,
    force_export: forceExport
  }

  // This is used only for logging by primary to record endpoint of requesting node
  if (selfEndpoint) {
    exportQueryParams.source_endpoint = selfEndpoint
  }

  // Make request to get data from /export route
  let exportResp
  try {
    exportResp = await asyncRetry({
      // Throws on any non-200 response code
      asyncFn: () =>
        axios({
          method: 'get',
          baseURL: nodeEndpointToFetchFrom,
          url: '/export',
          responseType: 'json',
          params: exportQueryParams,
          timeout: EXPORT_REQ_TIMEOUT_MS
        }),
      retries: EXPORT_REQ_MAX_RETRIES,
      log: false
    })
  } catch (e: any) {
    logger.error(`Error fetching /export route: ${e.message}`)
    return {
      error: {
        message: e.message,
        code: 'failure_export_wallet'
      }
    }
  }

  // Validate export response has cnodeUsers array with 1 wallet
  const { data: body } = exportResp
  if (!_.has(body, 'data.cnodeUsers') || _.isEmpty(body.data.cnodeUsers)) {
    return {
      error: {
        message: '"cnodeUsers" array is empty or missing from response body',
        code: 'failure_malformed_export'
      }
    }
  }
  const { cnodeUsers } = body.data
  if (Object.keys(cnodeUsers).length > 1) {
    return {
      error: {
        message: 'Multiple cnodeUsers returned from export',
        code: 'failure_malformed_export'
      }
    }
  }

  // Validate wallet from cnodeUsers array matches the wallet we requested in the /export request
  const fetchedCNodeUser: any = Object.values(cnodeUsers)[0]
  if (!_.has(fetchedCNodeUser, 'walletPublicKey')) {
    return {
      error: {
        message:
          '"walletPublicKey" property not found on CNodeUser in response object',
        code: 'failure_malformed_export'
      }
    }
  }
  if (wallet !== fetchedCNodeUser.walletPublicKey) {
    return {
      error: {
        message: `Returned data for walletPublicKey that was not requested: ${fetchedCNodeUser.walletPublicKey}`,
        code: 'failure_malformed_export'
      }
    }
  }

  logger.info('Export successful')
  return {
    fetchedCNodeUser
  }
}

export { fetchExportFromNode }
export type { FetchExportParams, FetchExportOutput }
