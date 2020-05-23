const ethers = require('ethers')
const abi = require('ethereumjs-abi')

/** ensures use of pre-configured web3 if provided */
let web3New
if (typeof web3 === 'undefined') {
  web3New = require('web3')
} else {
  web3New = web3
}

export const testContractKey = web3New.utils.utf8ToHex('TestContract')

/** Constant string values */
export const strings = {
  first: web3New.utils.utf8ToHex('first'),
  second: web3New.utils.utf8ToHex('second'),
  third: web3New.utils.utf8ToHex('third'),
  test: web3New.utils.utf8ToHex('test')
}
export const addressZero = '0x0000000000000000000000000000000000000000'

/** hex to utf8
 * @param {string} arg - Raw hex-encoded string returned from contract code
 * @returns {string} utf8 converted string value
 */
 export const toStr = (arg) => {
  return web3New.utils.hexToUtf8(arg)
}

/** TODO - change all duplicate func declarations to reference this */
export const getLatestBlock = async (web3) => {
  return web3.eth.getBlock('latest')
}

/** Returns formatted transaction receipt object with event and arg info
 * @param {object} txReceipt - transaction receipt object
 * @returns {object} w/event + args array from txReceipt
 */
export const parseTx = (txReceipt, multipleEvents = false) => {
  if (!txReceipt.logs.length >= 1) {
    throw new Error('Invalid txReceipt length')
  }
  
  if (multipleEvents) {
    let resp = []
    for (const log of txReceipt.logs) {
      if (!log.hasOwnProperty('event')) {
        throw new Error('Missing event log in tx receipt')
      }
      resp.push({
        'event': {
          'name': log.event,
          'args': log.args
        }
      })
    }
    return resp
  } else {
    if (!(txReceipt.logs[0].hasOwnProperty('event'))) {
      throw new Error('Missing event log in tx receipt')
    }
  
    return {
      'event': {
        'name': txReceipt.logs[0].event,
        'args': txReceipt.logs[0].args
      }
    }
  }
}

/** TODO */
export const assertThrows = async (blockOrPromise, expectedErrorCode, expectedReason) => {
  try {
    (typeof blockOrPromise === 'function') ? await blockOrPromise() : await blockOrPromise
  } catch (error) {
    assert(error.message.search(expectedErrorCode) > -1, `Expected error code "${expectedErrorCode}" but failed with "${error}" instead.`)
    return error
  }
  // assert.fail() for some reason does not have its error string printed 🤷
  assert(false, `Expected "${expectedErrorCode}"${expectedReason ? ` (with reason: "${expectedReason}")` : ''} but it did not fail`)
}

/** TODO */
export const assertRevert = async (blockOrPromise, expectedReason) => {
  const error = await assertThrows(blockOrPromise, 'revert', expectedReason)
  if (!expectedReason) {
    return
  }
  const expectedMsgFound = error.message.indexOf(expectedReason) >= 0
  assert.isTrue(expectedMsgFound, `Expected revert reason not found. Expected '${expectedReason}'. Found '${error.message}'`)
}

export const toBN = (val) => web3New.utils.toBN(val)

export const fromBN = (val) => val.toNumber()

export const audToWei = (val) => web3New.utils.toWei(val.toString(), 'ether')

export const audToWeiBN = (aud) => toBN(audToWei(aud))

export const fromWei = (wei) => web3.utils.fromWei(wei)

export const abiEncode = (types, values) => {
  const abi = new ethers.utils.AbiCoder()
  return abi.encode(types, values)
}

export const abiDecode = (types, data) => {
  const abi = new ethers.utils.AbiCoder()
  return abi.decode(types, data)
}

export const keccak256 = (values) => {
  return ethers.utils.keccak256(values)
}

export const encodeCall = (name, args, values) => {
  const methodId = abi.methodID(name, args).toString('hex')
  const params = abi.rawEncode(args, values).toString('hex')
  return '0x' + methodId + params
}

export const registerServiceProvider = async (token, staking, serviceProviderFactory, type, endpoint, amount, account) => {
  // Approve staking transfer
  await token.approve(staking.address, amount, { from: account })

  // register service provider
  const tx = await serviceProviderFactory.register(
    type,
    endpoint,
    amount,
    account,
    { from: account }
  )

  // parse and return args
  const args = tx.logs.find(log => log.event === 'RegisteredServiceProvider').args
  args.stakeAmount = args._stakeAmount
  args.spID = args._spID
  return args
}

export const deregisterServiceProvider = async (serviceProviderFactory, type, endpoint, account) => {
  const deregTx = await serviceProviderFactory.deregister(
    type,
    endpoint,
    { from: account }
  )

  // parse and return args
  const args = deregTx.logs.find(log => log.event === 'DeregisteredServiceProvider').args
  args.unstakeAmount = args._unstakeAmount
  args.spID = args._spID
  return args
}

export const initiateFundingRound = async (governance, claimsManagerRegKey, guardianAddress, expectedSuccess) => {
  const callValue0 = toBN(0)
  const signature = 'initiateRound()'
  const callData = abiEncode([], [])

  const txReceipt = await governance.guardianExecuteTransaction(
    claimsManagerRegKey,
    callValue0,
    signature,
    callData,
    { from: guardianAddress }
  )
  const tx = parseTx(txReceipt)

  assert.equal(tx.event.args.success, expectedSuccess, 'Expected event.args.success')
  
  return tx
}

export const deployToken = async (artifacts, proxyAdminAddress, proxyDeployerAddress) => {
  const AudiusToken = artifacts.require('AudiusToken')
  const AdminUpgradeabilityProxy = artifacts.require('AdminUpgradeabilityProxy')

  const token0 = await AudiusToken.new({ from: proxyDeployerAddress })
  const tokenInitData = encodeCall('initialize', [], [])
  const tokenProxy = await AdminUpgradeabilityProxy.new(
    token0.address,
    proxyAdminAddress,
    tokenInitData,
    { from: proxyDeployerAddress }
  )
  const token = await AudiusToken.at(tokenProxy.address)

  return token
}

export const deployRegistry = async (artifacts, proxyAdminAddress, proxyDeployerAddress) => {
  const Registry = artifacts.require('Registry')
  const AdminUpgradeabilityProxy = artifacts.require('AdminUpgradeabilityProxy')

  const registry0 = await Registry.new({ from: proxyDeployerAddress })
  const registryInitData = encodeCall('initialize', [], [])
  const registryProxy = await AdminUpgradeabilityProxy.new(
    registry0.address,
    proxyAdminAddress,
    registryInitData,
    { from: proxyDeployerAddress }
  )
  const registry = await Registry.at(registryProxy.address)

  return registry
}

export const deployGovernance = async (
  artifacts,
  proxyAdminAddress,
  proxyDeployerAddress,
  registry,
  stakingRegKey,
  governanceRegKey,
  votingPeriod,
  votingQuorum,
  guardianAddress
) => {
  const Governance = artifacts.require('Governance')
  const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')

  const governance0 = await Governance.new({ from: proxyDeployerAddress })
  const governanceInitializeData = encodeCall(
    'initialize',
    ['address', 'uint256', 'uint256', 'address'],
    [registry.address, votingPeriod, votingQuorum, guardianAddress]
  )
  // Initialize proxy with zero address
  const governanceProxy = await AudiusAdminUpgradeabilityProxy.new(
    governance0.address,
    proxyAdminAddress,
    governanceInitializeData,
    addressZero,
    { from: proxyDeployerAddress }
  )
  await governanceProxy.setAudiusGovernanceAddress(governanceProxy.address, { from: proxyAdminAddress })

  const governance = await Governance.at(governanceProxy.address)
  return governance
}

export const addServiceType = async (serviceType, typeMin, typeMax, governance, guardianAddress, serviceTypeManagerRegKey, expectedSuccess) => {
  const addServiceTypeSignature = 'addServiceType(bytes32,uint256,uint256)'
  const callValue0 = toBN(0)

  const callData = abiEncode(
    ['bytes32', 'uint256', 'uint256'],
    [serviceType, typeMin, typeMax]
  )
  const addServiceTypeTxReceipt = await governance.guardianExecuteTransaction(
    serviceTypeManagerRegKey,
    callValue0,
    addServiceTypeSignature,
    callData,
    { from: guardianAddress }
  )
  assert.equal(parseTx(addServiceTypeTxReceipt).event.args.success, expectedSuccess, 'Expected event.args.success')
}

export const slash = async (slashAmount, slashAccount, governance, delegateManagerRegKey, guardianAddress, expectedSuccess) => {
  const callValue0 = toBN(0)
  const signature = 'slash(uint256,address)'
  const callData = abiEncode(['uint256', 'address'], [slashAmount, slashAccount])

  const txReceipt = await governance.guardianExecuteTransaction(
    delegateManagerRegKey,
    callValue0,
    signature,
    callData,
    { from: guardianAddress }
  )
  const tx = parseTx(txReceipt)

  assert.equal(tx.event.args.success, expectedSuccess, 'Expected event.args.success')

  return tx
}
