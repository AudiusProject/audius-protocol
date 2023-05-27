import * as _lib from '../utils/lib.js'

const AudiusAdminUpgradeabilityProxy = artifacts.require(
  'AudiusAdminUpgradeabilityProxy'
)
const TrustedNotifierManager = artifacts.require('TrustedNotifierManager')

const governanceKey = web3.utils.utf8ToHex('Governance')
const trustedNotifierManagerKey = web3.utils.utf8ToHex('TrustedNotifierManager')

const VOTING_PERIOD = 10
const EXECUTION_DELAY = VOTING_PERIOD
const VOTING_QUORUM_PERCENT = 10

contract('TrustedNotifierManager', async function (accounts) {
  let registry, governance, trustedNotifierManager

  // intentionally not using acct0 to make sure no TX accidentally succeeds without specifying sender
  const [, proxyAdminAddress, proxyDeployerAddress] = accounts
  const guardianAddress = proxyDeployerAddress

  const notifier1Wallet = accounts[11]
  const notifier1Endpoint = 'notifier1Endpoint.com'
  const notifier1Email = 'email@notifier1Endpoint.com'

  const notifier2Wallet = accounts[12]
  const notifier2Endpoint = 'notifier2Endpoint.io'
  const notifier2Email = 'email@notifier2Endpoint.io'

  const notifier3Wallet = accounts[13]
  const notifier3Endpoint = 'notifier3Endpoint.co'
  const notifier3Email = 'email@notifier3Endpoint.co'

  const notifier4Wallet = accounts[14]
  const notifier4Endpoint = 'notifier4Endpoint.co'
  const notifier4Email = 'email@notifier4Endpoint.co'

  async function confirmNotifierState({
    trustedNotifierManager,
    expectedNotifierID,
    expectedLatestNotifierID,
    expectedWallet,
    expectedEndpoint,
    expectedEmail,
    expectedToExist = true
  }) {
    const latestNotifierID =
      await trustedNotifierManager.getLatestNotifierID.call()
    assert.isTrue(latestNotifierID.eq(_lib.toBN(expectedLatestNotifierID)))

    let notifier

    notifier = await trustedNotifierManager.getNotifierForID.call(
      expectedNotifierID
    )
    assert.isTrue(notifier.wallet === expectedWallet)
    assert.isTrue(notifier.endpoint === expectedEndpoint)
    assert.isTrue(notifier.email === expectedEmail)

    if (!expectedToExist) {
      expectedNotifierID = 0
    }

    notifier = await trustedNotifierManager.getNotifierForWallet.call(
      expectedWallet
    )
    assert.isTrue(notifier.ID.eq(_lib.toBN(expectedNotifierID)))
    // assert.isTrue(notifier.ID === expectedNotifierID)
    assert.isTrue(notifier.endpoint === expectedEndpoint)
    assert.isTrue(notifier.email === expectedEmail)

    notifier = await trustedNotifierManager.getNotifierForEndpoint.call(
      expectedEndpoint
    )
    assert.isTrue(notifier.ID.eq(_lib.toBN(expectedNotifierID)))
    assert.isTrue(notifier.wallet === expectedWallet)
    assert.isTrue(notifier.email === expectedEmail)

    notifier = await trustedNotifierManager.getNotifierForEmail.call(
      expectedEmail
    )
    assert.isTrue(notifier.ID.eq(_lib.toBN(expectedNotifierID)))
    assert.isTrue(notifier.wallet === expectedWallet)
    assert.isTrue(notifier.endpoint === expectedEndpoint)
  }

  /**
   * Init Registry & Governance contracts
   * Init TrustedNotifierManager contract with initial TrustedNotifier
   */
  beforeEach(async function () {
    // Deploy Registry
    registry = await _lib.deployRegistry(
      artifacts,
      proxyAdminAddress,
      proxyDeployerAddress
    )

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
    await registry.addContract(governanceKey, governance.address, {
      from: proxyDeployerAddress
    })

    // Deploy + register TrustedNotifierManager
    let trustedNotifierManager0 = await TrustedNotifierManager.new({
      from: proxyDeployerAddress
    })
    const trustedNotifierManagerCalldata = _lib.encodeCall(
      'initialize',
      ['address', 'address', 'string', 'string'],
      [governance.address, notifier1Wallet, notifier1Endpoint, notifier1Email]
    )
    const trustedNotifierManagerProxy =
      await AudiusAdminUpgradeabilityProxy.new(
        trustedNotifierManager0.address,
        governance.address,
        trustedNotifierManagerCalldata,
        { from: proxyAdminAddress }
      )
    trustedNotifierManager = await TrustedNotifierManager.at(
      trustedNotifierManagerProxy.address
    )
    await registry.addContract(
      trustedNotifierManagerKey,
      trustedNotifierManager.address,
      { from: proxyDeployerAddress }
    )
  })

  it('Confirm initial state', async function () {
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 1,
      expectedLatestNotifierID: 1,
      expectedWallet: notifier1Wallet,
      expectedEndpoint: notifier1Endpoint,
      expectedEmail: notifier1Email
    })
  })

  it('Register notifier', async function () {
    // Confirm intial state
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 1,
      expectedLatestNotifierID: 1,
      expectedWallet: notifier1Wallet,
      expectedEndpoint: notifier1Endpoint,
      expectedEmail: notifier1Email
    })

    // Register fails when not called from governance
    await _lib.assertRevert(
      trustedNotifierManager.registerNotifier(
        notifier2Wallet,
        notifier2Endpoint,
        notifier2Email,
        { from: notifier2Wallet }
      ),
      'TrustedNotifierManager: Only callable by Governance contract.'
    )

    // Register fails when wallet is zero address
    await _lib.assertRevert(
      governance.guardianExecuteTransaction(
        trustedNotifierManagerKey,
        _lib.CallValueZero,
        'registerNotifier(address,string,string)',
        _lib.abiEncode(
          ['address', 'string', 'string'],
          [_lib.addressZero, notifier2Endpoint, notifier2Email]
        ),
        { from: guardianAddress }
      ),
      'Governance: Transaction failed.'
    )

    // Register fails when endpoint is empty string
    await _lib.assertRevert(
      governance.guardianExecuteTransaction(
        trustedNotifierManagerKey,
        _lib.CallValueZero,
        'registerNotifier(address,string,string)',
        _lib.abiEncode(
          ['address', 'string', 'string'],
          [notifier2Wallet, '', notifier2Email]
        ),
        { from: guardianAddress }
      ),
      'Governance: Transaction failed.'
    )

    // Register fails when email is empty string
    await _lib.assertRevert(
      governance.guardianExecuteTransaction(
        trustedNotifierManagerKey,
        _lib.CallValueZero,
        'registerNotifier(address,string,string)',
        _lib.abiEncode(
          ['address', 'string', 'string'],
          [notifier2Wallet, notifier2Endpoint, '']
        ),
        { from: guardianAddress }
      ),
      'Governance: Transaction failed.'
    )

    // Register notifier
    await governance.guardianExecuteTransaction(
      trustedNotifierManagerKey,
      _lib.CallValueZero,
      'registerNotifier(address,string,string)',
      _lib.abiEncode(
        ['address', 'string', 'string'],
        [notifier2Wallet, notifier2Endpoint, notifier2Email]
      ),
      { from: guardianAddress }
    )

    // Confirm exists
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 2,
      expectedLatestNotifierID: 2,
      expectedWallet: notifier2Wallet,
      expectedEndpoint: notifier2Endpoint,
      expectedEmail: notifier2Email
    })

    // Register fails when wallet already registered
    await _lib.assertRevert(
      governance.guardianExecuteTransaction(
        trustedNotifierManagerKey,
        _lib.CallValueZero,
        'registerNotifier(address,string,string)',
        _lib.abiEncode(
          ['address', 'string', 'string'],
          [notifier2Wallet, notifier3Endpoint, notifier3Email]
        ),
        { from: guardianAddress }
      ),
      'Governance: Transaction failed.'
    )

    // Register fails when endpoint already registered
    await _lib.assertRevert(
      governance.guardianExecuteTransaction(
        trustedNotifierManagerKey,
        _lib.CallValueZero,
        'registerNotifier(address,string,string)',
        _lib.abiEncode(
          ['address', 'string', 'string'],
          [notifier3Wallet, notifier2Endpoint, notifier3Email]
        ),
        { from: guardianAddress }
      ),
      'Governance: Transaction failed.'
    )

    // Register fails when email already registered
    await _lib.assertRevert(
      governance.guardianExecuteTransaction(
        trustedNotifierManagerKey,
        _lib.CallValueZero,
        'registerNotifier(address,string,string)',
        _lib.abiEncode(
          ['address', 'string', 'string'],
          [notifier3Wallet, notifier3Endpoint, notifier2Email]
        ),
        { from: guardianAddress }
      ),
      'Governance: Transaction failed.'
    )
  })

  it('Deregister notifier via governance', async function () {
    // Confirm intial state
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 1,
      expectedLatestNotifierID: 1,
      expectedWallet: notifier1Wallet,
      expectedEndpoint: notifier1Endpoint,
      expectedEmail: notifier1Email
    })

    // Register notifier
    await governance.guardianExecuteTransaction(
      trustedNotifierManagerKey,
      _lib.CallValueZero,
      'registerNotifier(address,string,string)',
      _lib.abiEncode(
        ['address', 'string', 'string'],
        [notifier2Wallet, notifier2Endpoint, notifier2Email]
      ),
      { from: guardianAddress }
    )

    // Confirm exists
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 2,
      expectedLatestNotifierID: 2,
      expectedWallet: notifier2Wallet,
      expectedEndpoint: notifier2Endpoint,
      expectedEmail: notifier2Email
    })

    // Deregister notifier via governance
    await governance.guardianExecuteTransaction(
      trustedNotifierManagerKey,
      _lib.CallValueZero,
      'deregisterNotifier(address)',
      _lib.abiEncode(['address'], [notifier2Wallet]),
      { from: guardianAddress }
    )

    // Confirm no longer exists
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 2,
      expectedLatestNotifierID: 2,
      expectedWallet: _lib.addressZero,
      expectedEndpoint: '',
      expectedEmail: '',
      expectedToExist: false
    })
  })

  it('Deregister notifier directly', async function () {
    // Confirm intial state
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 1,
      expectedLatestNotifierID: 1,
      expectedWallet: notifier1Wallet,
      expectedEndpoint: notifier1Endpoint,
      expectedEmail: notifier1Email
    })

    // Register notifier
    await governance.guardianExecuteTransaction(
      trustedNotifierManagerKey,
      _lib.CallValueZero,
      'registerNotifier(address,string,string)',
      _lib.abiEncode(
        ['address', 'string', 'string'],
        [notifier2Wallet, notifier2Endpoint, notifier2Email]
      ),
      { from: guardianAddress }
    )

    // Confirm exists
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 2,
      expectedLatestNotifierID: 2,
      expectedWallet: notifier2Wallet,
      expectedEndpoint: notifier2Endpoint,
      expectedEmail: notifier2Email
    })

    // Deregister fails when not called from governance or notifier wallet
    await _lib.assertRevert(
      trustedNotifierManager.deregisterNotifier(notifier2Wallet, {
        from: notifier1Wallet
      }),
      'TrustedNotifierManager: Only callable by Governance contract or _wallet.'
    )

    // Deregister notifier directly
    await trustedNotifierManager.deregisterNotifier(notifier2Wallet, {
      from: notifier2Wallet
    })

    // Confirm no longer exists
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 2,
      expectedLatestNotifierID: 2,
      expectedWallet: _lib.addressZero,
      expectedEndpoint: '',
      expectedEmail: '',
      expectedToExist: false
    })
  })

  it('Register & deregister multiple notifiers', async function () {
    // Confirm intial state - notifier 1 exists
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 1,
      expectedLatestNotifierID: 1,
      expectedWallet: notifier1Wallet,
      expectedEndpoint: notifier1Endpoint,
      expectedEmail: notifier1Email
    })

    // Register notifier 2
    await governance.guardianExecuteTransaction(
      trustedNotifierManagerKey,
      _lib.CallValueZero,
      'registerNotifier(address,string,string)',
      _lib.abiEncode(
        ['address', 'string', 'string'],
        [notifier2Wallet, notifier2Endpoint, notifier2Email]
      ),
      { from: guardianAddress }
    )

    // Register notifier 3
    await governance.guardianExecuteTransaction(
      trustedNotifierManagerKey,
      _lib.CallValueZero,
      'registerNotifier(address,string,string)',
      _lib.abiEncode(
        ['address', 'string', 'string'],
        [notifier3Wallet, notifier3Endpoint, notifier3Email]
      ),
      { from: guardianAddress }
    )

    // Confirm notifier 2 exists
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 2,
      expectedLatestNotifierID: 3,
      expectedWallet: notifier2Wallet,
      expectedEndpoint: notifier2Endpoint,
      expectedEmail: notifier2Email
    })

    // Confirm notifier 3 exists
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 3,
      expectedLatestNotifierID: 3,
      expectedWallet: notifier3Wallet,
      expectedEndpoint: notifier3Endpoint,
      expectedEmail: notifier3Email
    })

    // Deregister notifier 2 via governance
    await governance.guardianExecuteTransaction(
      trustedNotifierManagerKey,
      _lib.CallValueZero,
      'deregisterNotifier(address)',
      _lib.abiEncode(['address'], [notifier2Wallet]),
      { from: guardianAddress }
    )

    // Confirm notifier 2 no longer exists
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 2,
      expectedLatestNotifierID: 3,
      expectedWallet: _lib.addressZero,
      expectedEndpoint: '',
      expectedEmail: '',
      expectedToExist: false
    })

    // Confirm notifier 3 still exists
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 3,
      expectedLatestNotifierID: 3,
      expectedWallet: notifier3Wallet,
      expectedEndpoint: notifier3Endpoint,
      expectedEmail: notifier3Email
    })

    // Register notifier 4
    await governance.guardianExecuteTransaction(
      trustedNotifierManagerKey,
      _lib.CallValueZero,
      'registerNotifier(address,string,string)',
      _lib.abiEncode(
        ['address', 'string', 'string'],
        [notifier4Wallet, notifier4Endpoint, notifier4Email]
      ),
      { from: guardianAddress }
    )

    // Confirm notifier 2 still does not exist
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 2,
      expectedLatestNotifierID: 4,
      expectedWallet: _lib.addressZero,
      expectedEndpoint: '',
      expectedEmail: '',
      expectedToExist: false
    })

    // Confirm notifier 3 still exists
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 3,
      expectedLatestNotifierID: 4,
      expectedWallet: notifier3Wallet,
      expectedEndpoint: notifier3Endpoint,
      expectedEmail: notifier3Email
    })

    // Confirm notifier 4 still exists
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 4,
      expectedLatestNotifierID: 4,
      expectedWallet: notifier4Wallet,
      expectedEndpoint: notifier4Endpoint,
      expectedEmail: notifier4Email
    })

    // Deregister notifier 3 directly
    await trustedNotifierManager.deregisterNotifier(notifier3Wallet, {
      from: notifier3Wallet
    })

    // Confirm notifier 2 still does not exist
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 2,
      expectedLatestNotifierID: 4,
      expectedWallet: _lib.addressZero,
      expectedEndpoint: '',
      expectedEmail: '',
      expectedToExist: false
    })

    // Confirm notifier 3 no longer exists
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 3,
      expectedLatestNotifierID: 4,
      expectedWallet: _lib.addressZero,
      expectedEndpoint: '',
      expectedEmail: '',
      expectedToExist: false
    })

    // Confirm notifier 4 still exists
    await confirmNotifierState({
      trustedNotifierManager,
      expectedNotifierID: 4,
      expectedLatestNotifierID: 4,
      expectedWallet: notifier4Wallet,
      expectedEndpoint: notifier4Endpoint,
      expectedEmail: notifier4Email
    })
  })

  it('governanceAddress modification', async function () {
    // Confirm initial governanceAddress
    let governanceAddress =
      await trustedNotifierManager.getGovernanceAddress.call()
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
      'Governance: Transaction failed.'
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
    await registry.upgradeContract(governanceKey, governance2.address, {
      from: proxyDeployerAddress
    })

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
})
