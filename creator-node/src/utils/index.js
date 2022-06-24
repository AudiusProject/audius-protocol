const validateMetadata = require('./validateAudiusUserMetadata')
const { validateAssociatedWallets } = validateMetadata

module.exports = {
  validateMetadata,
  validateAssociatedWallets
}
