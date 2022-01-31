const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades')

import * as _lib from '../utils/lib.js'

const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')
const TrustedNotifierManager = artifacts.require('TrustedNotifierManager')
const TrustedNotifierManager2 = artifacts.require('TrustedNotifierManager')

const governanceKey = web3.utils.utf8ToHex('Governance')
const trustedNotifierManagerKey = web3.utils.utf8ToHex('TrustedNotifierManager')

const VOTING_PERIOD = 10
const EXECUTION_DELAY = VOTING_PERIOD
const VOTING_QUORUM_PERCENT = 10

contract.only('TrustedNotifierManager', async function (accounts) {
  let registry, governance, trustedNotifierManager

  // intentionally not using acct0 to make sure no TX accidentally succeeds without specifying sender
  const [, proxyAdminAddress, proxyDeployerAddress] = accounts
  const guardianAddress = proxyDeployerAddress
  const notifier1Wallet = accounts[11]
  const notifier2Wallet = accounts[12]
  const notifier3Wallet = accounts[13]
  const notifier1Endpoint = 'notifier1Endpoint'
  const notifier2Endpoint = 'notifier2Endpoint'
  const notifier3Endpoint = 'notifier3Endpoint'

  async function confirmNotifierState({
    trustedNotifierManager, expectedNotifierID, expectedLatestNotifierID, expectedWallet, expectedEndpoint
  }) {
    const latestNotifierID = await trustedNotifierManager.getLatestNotifierID.call()
    assert.isTrue(latestNotifierID.eq(_lib.toBN(expectedLatestNotifierID)))

    const trustedNotifier = await trustedNotifierManager.getNotifierForID.call(expectedNotifierID)
    assert.isTrue(trustedNotifier.wallet === expectedWallet)
    assert.isTrue(trustedNotifier.endpoint === expectedEndpoint)

    const endpoint = await trustedNotifierManager.getEndpointForWallet.call(expectedWallet)
    assert.isTrue(endpoint === expectedEndpoint)

    const wallet = await trustedNotifierManager.getWalletForEndpoint.call(expectedEndpoint)
    assert.isTrue(wallet === expectedWallet)
  }

  // Init contracts - Registry, Governance, TrustedNotifierManager
  beforeEach(async function () {
    // Deploy Registry
    registry = await _lib.deployRegistry(artifacts, proxyAdminAddress, proxyDeployerAddress)

    // Deploy + register Governance
    governance = await _lib.deployGovernance(
      artifacts,
      proxyAdminAddress,
      proxyDeployerAddress,
      registry,
      VOTING_PERIOD,
      EXECUTION_DELAY,
      VOTING_QUORUM_PERCENT,
      guardianAddress
    )
    await registry.addContract(governanceKey, governance.address, { from: proxyDeployerAddress })

    // Deploy + register TrustedNotifierManager
    let trustedNotifierManager0 = await TrustedNotifierManager.new({ from: proxyDeployerAddress })
    const trustedNotifierManagerCalldata = _lib.encodeCall(
      'initialize', ['address'], [governance.address]
    )
    const trustedNotifierManagerProxy = await AudiusAdminUpgradeabilityProxy.new(
      trustedNotifierManager0.address,
      governance.address,
      trustedNotifierManagerCalldata,
      { from: proxyAdminAddress }
    )
    trustedNotifierManager = await TrustedNotifierManager.at(trustedNotifierManagerProxy.address)
    await registry.addContract(trustedNotifierManagerKey, trustedNotifierManager.address, { from: proxyDeployerAddress })
  })

  it('Register notifier', async function () {
    // Confirm intial empty state
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 0,
      expectedLatestNotifierID: 0,
      expectedWallet: _lib.addressZero,
      expectedEndpoint: ''
    })

    // Register fails when not called from governance
    await _lib.assertRevert(
      trustedNotifierManager.registerNotifier(notifier1Wallet, notifier1Endpoint, { from: notifier1Wallet }),
      'TrustedNotifierManager: Only callable by Governance contract.'
    )

    // Register notifier
    await governance.guardianExecuteTransaction(
      trustedNotifierManagerKey,
      _lib.CallValueZero,
      'registerNotifier(address,string)',
      _lib.abiEncode(['address', 'string'], [notifier1Wallet, notifier1Endpoint]),
      { from: guardianAddress }
    )

    // Confirm exists
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 1,
      expectedLatestNotifierID: 1,
      expectedWallet: notifier1Wallet,
      expectedEndpoint: notifier1Endpoint
    })

    // Register fails when wallet already registered
    await _lib.assertRevert(
      governance.guardianExecuteTransaction(
        trustedNotifierManagerKey,
        _lib.CallValueZero,
        'registerNotifier(address,string)',
        _lib.abiEncode(['address', 'string'], [notifier1Wallet, notifier2Endpoint]),
        { from: guardianAddress }
      ),
      'Governance: Transaction failed.'
    )

    await _lib.assertRevert(
      governance.guardianExecuteTransaction(
        trustedNotifierManagerKey,
        _lib.CallValueZero,
        'registerNotifier(address,string)',
        _lib.abiEncode(['address', 'string'], [notifier2Wallet, notifier1Endpoint]),
        { from: guardianAddress }
      ),
      'Governance: Transaction failed.'
    )
  })

  it('Deregister notifier via governance', async function () {
    // Confirm intial empty state
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 0,
      expectedLatestNotifierID: 0,
      expectedWallet: _lib.addressZero,
      expectedEndpoint: ''
    })

    // Register notifier
    await governance.guardianExecuteTransaction(
      trustedNotifierManagerKey,
      _lib.CallValueZero,
      'registerNotifier(address,string)',
      _lib.abiEncode(['address', 'string'], [notifier1Wallet, notifier1Endpoint]),
      { from: guardianAddress }
    )

    // Confirm exists
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 1,
      expectedLatestNotifierID: 1,
      expectedWallet: notifier1Wallet,
      expectedEndpoint: notifier1Endpoint
    })

     // Deregister notifier via governance
     await governance.guardianExecuteTransaction(
      trustedNotifierManagerKey,
      _lib.CallValueZero,
      'deregisterNotifier(address)',
      _lib.abiEncode(['address'], [notifier1Wallet]),
      { from: guardianAddress }
    )

    // Confirm no longer exists
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 1,
      expectedLatestNotifierID: 1,
      expectedWallet: _lib.addressZero,
      expectedEndpoint: ''
    })
  })

  it('Deregister notifier directly', async function () {
    // Confirm intial empty state
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 0,
      expectedLatestNotifierID: 0,
      expectedWallet: _lib.addressZero,
      expectedEndpoint: ''
    })
 
    // Register notifier
    await governance.guardianExecuteTransaction(
      trustedNotifierManagerKey,
      _lib.CallValueZero,
      'registerNotifier(address,string)',
      _lib.abiEncode(['address', 'string'], [notifier1Wallet, notifier1Endpoint]),
      { from: guardianAddress }
    )

    // Confirm exists
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 1,
      expectedLatestNotifierID: 1,
      expectedWallet: notifier1Wallet,
      expectedEndpoint: notifier1Endpoint
    })

    // Deregister fails when not called from governance or notifier wallet
    await _lib.assertRevert(
      trustedNotifierManager.deregisterNotifier(notifier1Wallet, { from: notifier2Wallet }),
      'TrustedNotifierManager: Only callable by Governance contract or _wallet.'
    )

    // Deregister notifier directly
    await trustedNotifierManager.deregisterNotifier(notifier1Wallet, { from: notifier1Wallet })

    // Confirm no longer exists
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 1,
      expectedLatestNotifierID: 1,
      expectedWallet: _lib.addressZero,
      expectedEndpoint: ''
    })
  })

  it('Register & deregister multiple notifiers', async function () {
    // Confirm intial empty state
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 0,
      expectedLatestNotifierID: 0,
      expectedWallet: _lib.addressZero,
      expectedEndpoint: ''
    })

    // Register notifier 1
    await governance.guardianExecuteTransaction(
      trustedNotifierManagerKey,
      _lib.CallValueZero,
      'registerNotifier(address,string)',
      _lib.abiEncode(['address', 'string'], [notifier1Wallet, notifier1Endpoint]),
      { from: guardianAddress }
    )

    // Register notifier 2
    await governance.guardianExecuteTransaction(
      trustedNotifierManagerKey,
      _lib.CallValueZero,
      'registerNotifier(address,string)',
      _lib.abiEncode(['address', 'string'], [notifier2Wallet, notifier2Endpoint]),
      { from: guardianAddress }
    )

    // Confirm notifier 1 exists
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 1,
      expectedLatestNotifierID: 2,
      expectedWallet: notifier1Wallet,
      expectedEndpoint: notifier1Endpoint
    })

    // Confirm notifier 2 exists
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 2,
      expectedLatestNotifierID: 2,
      expectedWallet: notifier2Wallet,
      expectedEndpoint: notifier2Endpoint
    })

    // Deregister notifier via governance
    await governance.guardianExecuteTransaction(
      trustedNotifierManagerKey,
      _lib.CallValueZero,
      'deregisterNotifier(address)',
      _lib.abiEncode(['address'], [notifier1Wallet]),
      { from: guardianAddress }
    )

    // Confirm notifier 1 no longer exists
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 1,
      expectedLatestNotifierID: 2,
      expectedWallet: _lib.addressZero,
      expectedEndpoint: ''
    })

    // Confirm notifier 2 still exists
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 2,
      expectedLatestNotifierID: 2,
      expectedWallet: notifier2Wallet,
      expectedEndpoint: notifier2Endpoint
    })

    // Register notifier 3
    await governance.guardianExecuteTransaction(
      trustedNotifierManagerKey,
      _lib.CallValueZero,
      'registerNotifier(address,string)',
      _lib.abiEncode(['address', 'string'], [notifier3Wallet, notifier3Endpoint]),
      { from: guardianAddress }
    )

    // Confirm notifier 1 still does not exist
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 1,
      expectedLatestNotifierID: 3,
      expectedWallet: _lib.addressZero,
      expectedEndpoint: ''
    })

    // Confirm notifier 2 still exists
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 2,
      expectedLatestNotifierID: 3,
      expectedWallet: notifier2Wallet,
      expectedEndpoint: notifier2Endpoint
    })

    // Confirm notifier 3 still exists
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 3,
      expectedLatestNotifierID: 3,
      expectedWallet: notifier3Wallet,
      expectedEndpoint: notifier3Endpoint
    })

    // Deregister notifier 2 directly
    await trustedNotifierManager.deregisterNotifier(notifier2Wallet, { from: notifier2Wallet })

    // Confirm notifier 1 still does not exist
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 1,
      expectedLatestNotifierID: 3,
      expectedWallet: _lib.addressZero,
      expectedEndpoint: ''
    })

    // Confirm notifier 2 no longer exists
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 2,
      expectedLatestNotifierID: 3,
      expectedWallet: _lib.addressZero,
      expectedEndpoint: ''
    })

    // Confirm notifier 3 still exists
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 3,
      expectedLatestNotifierID: 3,
      expectedWallet: notifier3Wallet,
      expectedEndpoint: notifier3Endpoint
    })
  })

  it('governanceAddress modification', async function () {
    // Confirm initial governanceAddress
    let governanceAddress = await trustedNotifierManager.getGovernanceAddress.call()
    assert.isTrue(governanceAddress === governance.address)

    // setGovernanceAddress fails with invalid governance contract address
    await _lib.assertRevert(
      governance.guardianExecuteTransaction(
        trustedNotifierManagerKey,
        _lib.toBN(0),
        'setGovernanceAddress(address)',
        _lib.abiEncode(['address'], [accounts[15]]),
        { from: guardianAddress }
      ),
      "Governance: Transaction failed."
    )

    // Deploy + register new Governance
    const governance2 = await _lib.deployGovernance(
      artifacts,
      proxyAdminAddress,
      proxyDeployerAddress,
      registry,
      VOTING_PERIOD,
      EXECUTION_DELAY,
      VOTING_QUORUM_PERCENT,
      guardianAddress
    )
    await registry.upgradeContract(governanceKey, governance2.address, { from: proxyDeployerAddress })

    // setGovernanceAddress
    await governance.guardianExecuteTransaction(
      trustedNotifierManagerKey,
      _lib.toBN(0),
      'setGovernanceAddress(address)',
      _lib.abiEncode(['address'], [governance2.address]),
      { from: guardianAddress }
    )

    // Confirm new governanceAddress
    governanceAddress = await trustedNotifierManager.getGovernanceAddress.call()
    assert.isTrue(governanceAddress === governance2.address)
  })

  it('Test proxy upgrade safety via openzeppelin tooling', async () => {
    // https://docs.openzeppelin.com/upgrades-plugins/1.x/truffle-upgrades#test-usage
    // deployProxy and upgradeProxy run some tests to ensure

    const trustedNotifierManager1 = await deployProxy(TrustedNotifierManager, [governance.address])
    await upgradeProxy(trustedNotifierManager1, TrustedNotifierManager2)
  })
})