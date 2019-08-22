/**
 * *NOTE* - this should only be used for local functions
 * Given an audiusLibs instance, return web3 instance from ethWeb3Manager
 * @param {*} audiusLibs
 */
async function getEthWeb3AndAccounts (audiusLibs) {
  const ethWeb3 = audiusLibs.ethWeb3Manager.getWeb3()
  const ethAccounts = await ethWeb3.eth.getAccounts()
  console.log(ethWeb3, ethAccounts)
  return { ethWeb3, ethAccounts }
}

function convertAudsToWeiBN (ethWeb3, amountOfAUDS) {
  const tokenInWei = ethWeb3.utils.toWei(amountOfAUDS.toString(), 'ether')
  return ethWeb3.utils.toBN(tokenInWei)
}

module.exports = { getEthWeb3AndAccounts, convertAudsToWeiBN }
