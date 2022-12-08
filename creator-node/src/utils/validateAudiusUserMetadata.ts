import type { Request } from 'express'
import { CustomRequest } from '../utils'

const Web3 = require('web3')
const web3 = new Web3()

type MetadataJson = {
  user_id?: string
  associated_wallets?: Record<
    string,
    {
      signature: string
    }
  >
}

/**
 * Validates that the user id was signed by the associated wallets
 */
export const validateAssociatedWallets = (metadataJSON: MetadataJson) => {
  if ('user_id' in metadataJSON && 'associated_wallets' in metadataJSON) {
    const userId = metadataJSON.user_id
    const walletMappings = metadataJSON.associated_wallets
    if (!walletMappings) return true
    if (typeof walletMappings !== 'object') return true
    const message = `AudiusUserID:${userId}`
    return Object.keys(walletMappings).every((wallet) => {
      if (
        typeof walletMappings[wallet] !== 'object' ||
        walletMappings[wallet] === null ||
        !('signature' in walletMappings[wallet])
      )
        return false
      const signature = walletMappings[wallet].signature
      const recoveredWallet = web3.eth.accounts.recover(message, signature)
      return recoveredWallet === wallet
    })
  }
  return true
}

export const validateMetadata = (req: Request, metadataJSON: MetadataJson) => {
  // Check associated wallets
  if (typeof metadataJSON !== 'object' || metadataJSON === null) {
    return false
  } else if (!validateAssociatedWallets(metadataJSON)) {
    const reqWithLogger = req as CustomRequest
    reqWithLogger.logger.warn('Associated Wallets do not match signatures')
    return false
  }

  // TODO: Add more validation checks
  return true
}
