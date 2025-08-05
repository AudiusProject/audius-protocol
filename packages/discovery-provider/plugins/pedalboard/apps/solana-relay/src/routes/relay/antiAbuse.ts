import fetch from 'cross-fetch'
import { Logger } from 'pino'

import { config } from '../../config'
import { logger } from '../../logger'

/**
 * Checks if a user is abusive by querying the anti-abuse oracle
 * @param wallet - The wallet address to check
 * @param log - Optional logger instance, defaults to the module logger
 * @returns Promise<boolean> - true if user is abusive (response not 200), false otherwise
 */
export const isUserAbusive = async (
  wallet: string,
  log: Logger = logger
): Promise<boolean> => {
  try {
    const url = `${config.antiAbuseOracle}/attestation/check?wallet=${wallet}`
    const response = await fetch(url)
    return response.status !== 200
  } catch (error) {
    log.error(
      { error, wallet },
      'Error checking anti-abuse status, defaulting to not abusive'
    )
    return false
  }
}
