const util = require('util')
const exec = util.promisify(require('child_process').exec)
/**
 * *NOTE* - this should only be used for local functions
 * Given an audiusLibs instance, return web3 instance from ethWeb3Manager
 * @param {*} audiusLibs
 */
async function getEthWeb3AndAccounts (audiusLibs) {
  const ethWeb3 = audiusLibs.ethWeb3Manager.getWeb3()
  const ethAccounts = await ethWeb3.eth.getAccounts()
  return { ethWeb3, ethAccounts }
}

function convertAudsToWeiBN (ethWeb3, amountOfAUDS) {
  const tokenInWei = ethWeb3.utils.toWei(amountOfAUDS.toString(), 'ether')
  return ethWeb3.utils.toBN(tokenInWei)
}

async function execParseOutput (cmd) {
  let r = await exec(cmd)
  let stdout = r.stdout
  let parsed = JSON.parse(stdout)
  return parsed
}

async function getDataContractAccounts () {
  return execParseOutput('docker exec audius_ganache_cli cat contracts-ganache-accounts.json')
}

async function getEthContractAccounts () {
  return execParseOutput('docker exec audius_ganache_cli_eth_contracts cat eth-contracts-ganache-accounts.json')
}

module.exports = { getEthWeb3AndAccounts, convertAudsToWeiBN, getDataContractAccounts, getEthContractAccounts }
