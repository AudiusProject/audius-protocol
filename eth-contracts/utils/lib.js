const ethers = require('ethers')
const abi = require('ethereumjs-abi')
const assert = require('assert')

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
  assert.equal(expectedMsgFound, true, `Expected revert reason not found. Expected '${expectedReason}'. Found '${error.message}'`)
}

export const toBN = (val) => web3New.utils.toBN(val)

export const fromBN = (val) => val.toNumber()

export const audToWei = (val) => web3New.utils.toWei(val.toString(), 'ether')

export const audToWeiBN = (aud) => toBN(audToWei(aud))

export const fromWei = (wei) => web3New.utils.fromWei(wei)

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

export const initiateFundingRound = async (governance, claimsManagerRegKey, guardianAddress) => {
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

  return parseTx(txReceipt)
}

export const deployToken = async (
  artifacts,
  proxyAdminAddress,
  proxyDeployerAddress,
  tokenOwnerAddress,
  governanceAddress
) => {
  const AudiusToken = artifacts.require('AudiusToken')
  const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')

  const token0 = await AudiusToken.new({ from: proxyDeployerAddress })
  const tokenInitData = encodeCall(
    'initialize',
    ['address', 'address'],
    [tokenOwnerAddress, governanceAddress]
  )
  const tokenProxy = await AudiusAdminUpgradeabilityProxy.new(
    token0.address,
    proxyAdminAddress,
    tokenInitData,
    governanceAddress,
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

export const addServiceType = async (serviceType, typeMin, typeMax, governance, guardianAddress, serviceTypeManagerRegKey) => {
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

  return parseTx(addServiceTypeTxReceipt)
}

export const slash = async (slashAmount, slashAccount, governance, delegateManagerRegKey, guardianAddress) => {
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
  return parseTx(txReceipt)
}

// Test helper to set staking address in Governance
export const configureGovernanceStakingAddress = async (
  governance,
  governanceKey,
  guardianAddress,
  stakingAddress
) => {
  const txReceipt = await governance.guardianExecuteTransaction(
    governanceKey,
    toBN(0),
    'setStakingAddress(address)',
    abiEncode(['address'], [stakingAddress]),
    { from: guardianAddress }
  )
  assert.equal(stakingAddress, await governance.getStakingAddress(), 'Expect staking in governance to be set')

  return parseTx(txReceipt)
}

// Test helper to set staking addresses
export const configureStakingContractAddresses = async (
  governance,
  guardianAddress,
  stakingProxyKey,
  staking,
  spAddress,
  claimsManagerAddress,
  delegateManagerAddress
) => {
  await governance.guardianExecuteTransaction(
    stakingProxyKey,
    toBN(0),
    'setServiceProviderFactoryAddress(address)',
    abiEncode(['address'], [spAddress]),
    { from: guardianAddress }
  )
  await governance.guardianExecuteTransaction(
    stakingProxyKey,
    toBN(0),
    'setClaimsManagerAddress(address)',
    abiEncode(['address'], [claimsManagerAddress]),
    { from: guardianAddress }
  )
  await governance.guardianExecuteTransaction(
    stakingProxyKey,
    toBN(0),
    'setDelegateManagerAddress(address)',
    abiEncode(['address'], [delegateManagerAddress]),  
    { from: guardianAddress }
  )

  assert.equal(spAddress, await staking.getServiceProviderFactoryAddress(), 'Unexpected sp address')
  assert.equal(claimsManagerAddress, await staking.getClaimsManagerAddress(), 'Unexpected claims address')
  assert.equal(delegateManagerAddress, await staking.getDelegateManagerAddress(), 'Unexpected delegate manager address')
}

// Test helper to set claimsManager contract addresses
export const configureClaimsManagerContractAddresses = async (
  governance,
  guardianAddress,
  claimsManagerRegKey,
  claimsManager,
  stakingAddress,
  spFactoryAddress,
  delegateManagerAddress
) => {
  await governance.guardianExecuteTransaction(
    claimsManagerRegKey,
    toBN(0),
    'setStakingAddress(address)',
    abiEncode(['address'], [stakingAddress]),
    { from: guardianAddress }
  )
  assert.equal(stakingAddress, await claimsManager.getStakingAddress(), 'Unexpected staking address')

  await governance.guardianExecuteTransaction(
    claimsManagerRegKey,
    toBN(0),
    'setServiceProviderFactoryAddress(address)',
    abiEncode(['address'], [spFactoryAddress]),
    { from: guardianAddress }
  )
  assert.equal(spFactoryAddress, await claimsManager.getServiceProviderFactoryAddress(), 'Unexpected sp address')

  await governance.guardianExecuteTransaction(
    claimsManagerRegKey,
    toBN(0),
    'setDelegateManagerAddress(address)',
    abiEncode(['address'], [delegateManagerAddress]),
    { from: guardianAddress }
  )
  assert.equal(delegateManagerAddress, await claimsManager.getDelegateManagerAddress(), 'Unexpected delegate managere')
}

// Test helper to set delegateManager contract addresses
export const configureDelegateManagerAddresses = async (
  governance,
  guardianAddress,
  key,
  delegateManager,
  stakingAddress,
  spFactoryAddress,
  claimsManagerAddress
) => {
  await governance.guardianExecuteTransaction(
    key,
    toBN(0),
    'setStakingAddress(address)',
    abiEncode(['address'], [stakingAddress]),
    { from: guardianAddress }
  )
  assert.equal(stakingAddress, await delegateManager.getStakingAddress(), 'Unexpected staking address')

  await governance.guardianExecuteTransaction(
    key,
    toBN(0),
    'setServiceProviderFactoryAddress(address)',
    abiEncode(['address'], [spFactoryAddress]),
    { from: guardianAddress }
  )
  assert.equal(spFactoryAddress, await delegateManager.getServiceProviderFactoryAddress(), 'Unexpected sp address')

  await governance.guardianExecuteTransaction(
    key,
    toBN(0),
    'setClaimsManagerAddress(address)',
    abiEncode(['address'], [claimsManagerAddress]),
    { from: guardianAddress }
  )
  assert.equal(claimsManagerAddress, await delegateManager.getClaimsManagerAddress(), 'Unexpected claim manager addr')
}

// Test helper to set serviceProviderFactory contract addresses
export const configureServiceProviderFactoryAddresses = async (
  governance,
  guardianAddress,
  key,
  spFactory,
  stakingAddress,
  serviceTypeManagerAddress,
  claimsManagerAddress,
  delegateManagerAddress
) => {
  await governance.guardianExecuteTransaction(
    key,
    toBN(0),
    'setStakingAddress(address)',
    abiEncode(['address'], [stakingAddress]),
    { from: guardianAddress }
  )
  assert.equal(stakingAddress, await spFactory.getStakingAddress(), 'Unexpected staking address')

  await governance.guardianExecuteTransaction(
    key,
    toBN(0),
    'setServiceTypeManagerAddress(address)',
    abiEncode(['address'], [serviceTypeManagerAddress]),
    { from: guardianAddress }
  )
  assert.equal(serviceTypeManagerAddress, await spFactory.getServiceTypeManagerAddress(), 'Unexpected service type manager address')

  await governance.guardianExecuteTransaction(
    key,
    toBN(0),
    'setClaimsManagerAddress(address)',
    abiEncode(['address'], [claimsManagerAddress]),
    { from: guardianAddress }
  )
  assert.equal(claimsManagerAddress, await spFactory.getClaimsManagerAddress(), 'Unexpected claim manager addr')

  await governance.guardianExecuteTransaction(
    key,
    toBN(0),
    'setDelegateManagerAddress(address)',
    abiEncode(['address'], [delegateManagerAddress]),
    { from: guardianAddress }
  )
  assert.equal(delegateManagerAddress, await spFactory.getDelegateManagerAddress(), 'Unexpected delegate manager addr')
}

export const registerContract = async (governance, contractKey, contractAddress, guardianAddress) => {
  const txR = await governance.guardianExecuteTransaction(
    web3New.utils.utf8ToHex("Registry"),
    toBN(0),
    'addContract(bytes32,address)',
    abiEncode(['bytes32', 'address'], [contractKey, contractAddress]),
    { from: guardianAddress }
  )

  return parseTx(txR)
}
