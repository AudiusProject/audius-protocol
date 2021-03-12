const Web3 = require('web3')
const web3 = new Web3()

/**
 * Validates that the user id was signed by the associated wallets
 */
const validateAssociatedWallets = (metadataJSON) => {
  if ('user_id' in metadataJSON && 'associated_wallets' in metadataJSON) {
    const userId = metadataJSON['user_id']
    const walletMappings = metadataJSON['associated_wallets']
    if (typeof walletMappings !== 'object' || walletMappings === null) return true
    const message = `AudiusUserID:${userId}`
    return Object.keys(walletMappings).every(wallet => {
      if (
        typeof walletMappings[wallet] !== 'object' ||
        walletMappings[wallet] === null ||
        !('signature' in walletMappings[wallet])
      ) return false
      const signature = walletMappings[wallet].signature
      const recoveredWallet = web3.eth.accounts.recover(message, signature)
      return recoveredWallet === wallet
    })
  }
  return true
}

const validateMetadata = (req, metadataJSON) => {
  // Check associated wallets
  if (!validateAssociatedWallets(metadataJSON)) {
    req.logger.info('Associated Wallets do not match signatures')
    return false
  }

  // TODO: Add more validation checks
  return true
}

module.exports = validateMetadata
module.exports.validateAssociatedWallets = validateAssociatedWallets
