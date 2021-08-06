const SOLANA_CHAIN_ID = '115'
const SOLANA_BRIDGE_CONTRACT = 'ffff'

const ETH_CHAIN_ID = '2'

async function initWormhole (audiusLibs) {
	console.log('init wormhole')

  await audiusLibs.ethContracts.WormholeClient.registerChain({
    foreignChainId: SOLANA_CHAIN_ID,
    foreignBridgeContract: SOLANA_BRIDGE_CONTRACT
  })

  await audiusLibs.ethContracts.WormholeClient.createWrappedAudio({
    foreignChainId: SOLANA_CHAIN_ID
  })

  await audiusLibs.ethContracts.WormholeClient.transferTokens({
    amount: '1000000000000000000',
    recipient: '0x855FA758c77D68a04990E992aA4dcdeF899F654A',
    recipientChainId: SOLANA_CHAIN_ID
  })

  await audiusLibs.ethContracts.WormholeClient.completeTransfer({
    amount: '1000000000000000000',
    recipient: '0x855FA758c77D68a04990E992aA4dcdeF899F654A',
    tokenChainId: ETH_CHAIN_ID,
    recipientChainId: SOLANA_CHAIN_ID
  })
}

module.exports = { initWormhole }
