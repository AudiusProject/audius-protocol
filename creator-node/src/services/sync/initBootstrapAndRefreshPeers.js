/**
 * Given IPFS node peer addresses, add to bootstrap peers list and manually connect
 **/
 async function initBootstrapAndRefreshPeers(
  { ipfs },
  logger,
  targetIPFSPeerAddresses,
  logPrefix
) {
  logPrefix = `${logPrefix} [initBootstrapAndRefreshPeers]`
  try {
    // Get own IPFS node's peer addresses
    const ipfsID = await ipfs.id()
    if (!ipfsID.hasOwnProperty('addresses')) {
      throw new Error('Failed to retrive own IPFS node addresses')
    }
    const ipfsPeerAddresses = ipfsID.addresses

    // For each targetPeerAddress, add to trusted peer list and open connection.
    for (const targetPeerAddress of targetIPFSPeerAddresses) {
      if (
        targetPeerAddress.includes('ip6') ||
        targetPeerAddress.includes('127.0.0.1')
      )
        continue
      if (ipfsPeerAddresses.includes(targetPeerAddress)) {
        logger.debug(logPrefix, 'ipfs addresses are same - do not connect')
        continue
      }

      // Add to list of bootstrap peers
      let results = await ipfs.bootstrap.add(targetPeerAddress)
      logger.debug(logPrefix, 'ipfs bootstrap add results:', results)

      // Manually connect to peer.
      results = await ipfs.swarm.connect(targetPeerAddress)
      logger.debug(logPrefix, 'peer connection results:', results.Strings[0])
    }
    logger.info(logPrefix, 'Completed')
  } catch (e) {
    const errorMsg = `${logPrefix} ERROR: ${e.message}`
    logger.error(errorMsg)
    throw new Error(errorMsg)
  }
}

module.exports = initBootstrapAndRefreshPeers