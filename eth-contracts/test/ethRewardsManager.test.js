import * as _lib from '../utils/lib.js'
const { time, expectEvent } = require('@openzeppelin/test-helpers')

const MockDelegateManager = artifacts.require('MockDelegateManager')
const MockStakingCaller = artifacts.require('MockStakingCaller')
const MockWormhole = artifacts.require('MockWormhole')
const EthRewardsManager = artifacts.require('EthRewardsManager')
const Staking = artifacts.require('Staking')
const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')
const ClaimsManager = artifacts.require('ClaimsManager')

const stakingProxyKey = web3.utils.utf8ToHex('StakingProxy')
const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')
const delegateManagerKey = web3.utils.utf8ToHex('DelegateManager')
const governanceKey = web3.utils.utf8ToHex('Governance')
const claimsManagerProxyKey = web3.utils.utf8ToHex('ClaimsManagerProxy')
const tokenRegKey = web3.utils.utf8ToHex('TokenKey')
const ethRewardsManagerProxyKey = web3.utils.utf8ToHex('EthRewardsManagerProxy')

const RECURRING_COMMUNITY_FUNDING_AMOUNT = 120
const DEFAULT_AMOUNT = _lib.audToWeiBN(120)
const VOTING_PERIOD = 10
const EXECUTION_DELAY = VOTING_PERIOD
const VOTING_QUORUM_PERCENT = 10

const callValue0 = _lib.toBN(0)

contract('EthRewardsManager', async (accounts) => {
  let token, registry, governance, staking, claimsManager, ethRewardsManager
  let mockDelegateManager, mockStakingCaller, mockWormhole

  // intentionally not using acct0 to make sure no TX accidentally succeeds without specifying sender
  const [, proxyAdminAddress, proxyDeployerAddress, staker, antiAbuseOracleAddress1, antiAbuseOracleAddress2, antiAbuseOracleAddress3] = accounts
  const tokenOwnerAddress = proxyDeployerAddress
  const guardianAddress = proxyDeployerAddress
  const antiAbuseOracleAddresses = [antiAbuseOracleAddress1, antiAbuseOracleAddress2, antiAbuseOracleAddress3]
  const recipient = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex')

  const approveTransferAndStake = async (amount, staker) => {
    // Transfer default tokens to
    await token.transfer(staker, amount, { from: proxyDeployerAddress })
    // Allow Staking app to move owner tokens
    await token.approve(staking.address, amount, { from: staker })
    // Stake tokens
    await mockStakingCaller.stakeFor(staker, amount)
  }

  beforeEach(async () => {
    // Deploy registry
    registry = await _lib.deployRegistry(artifacts, proxyAdminAddress, proxyDeployerAddress)

    // Deploy + register governance
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

    // Deploy + register token
    token = await _lib.deployToken(
      artifacts,
      proxyAdminAddress,
      proxyDeployerAddress,
      tokenOwnerAddress,
      governance.address
    )
    await registry.addContract(tokenRegKey, token.address, { from: proxyDeployerAddress })

    // Deploy and register staking
    const staking0 = await Staking.new({ from: proxyDeployerAddress })
    const stakingInitializeData = _lib.encodeCall(
      'initialize',
      ['address', 'address'],
      [token.address, governance.address]
    )
    const stakingProxy = await AudiusAdminUpgradeabilityProxy.new(
      staking0.address,
      governance.address,
      stakingInitializeData,
      { from: proxyDeployerAddress }
    )
    await registry.addContract(stakingProxyKey, stakingProxy.address, { from: proxyDeployerAddress })
    staking = await Staking.at(stakingProxy.address)

    // Mock SP for test
    mockStakingCaller = await MockStakingCaller.new()
    await mockStakingCaller.initialize(stakingProxy.address, token.address)
    await registry.addContract(serviceProviderFactoryKey, mockStakingCaller.address, { from: proxyDeployerAddress })

    // Mock Wormhole for test
    mockWormhole = await MockWormhole.new()

    // Deploy claimsManagerProxy
    const claimsManager0 = await ClaimsManager.new({ from: proxyDeployerAddress })
    const claimsInitializeCallData = _lib.encodeCall(
      'initialize',
      ['address', 'address'],
      [token.address, governance.address]
    )
    const claimsManagerProxy = await AudiusAdminUpgradeabilityProxy.new(
      claimsManager0.address,
      governance.address,
      claimsInitializeCallData,
      { from: proxyDeployerAddress }
    )
    claimsManager = await ClaimsManager.at(claimsManagerProxy.address)

    // Register claimsManagerProxy
    await registry.addContract(claimsManagerProxyKey, claimsManagerProxy.address, { from: proxyDeployerAddress })

    // Deploy mock delegate manager with only function to forward processClaim call
    mockDelegateManager = await MockDelegateManager.new()
    await mockDelegateManager.initialize(claimsManagerProxy.address)
    await registry.addContract(delegateManagerKey, mockDelegateManager.address, { from: proxyDeployerAddress })

    // Deploy ethRewardsManagerProxy
    const ethRewardsManager0 = await EthRewardsManager.new({ from: proxyDeployerAddress })
    const ethRewardsManagerInitializeCallData = _lib.encodeCall(
      'initialize',
      ['address', 'address', 'address', 'bytes32', 'address[]'],
      [token.address, governance.address, mockWormhole.address, recipient, antiAbuseOracleAddresses]
    )
    const ethRewardsManagerProxy = await AudiusAdminUpgradeabilityProxy.new(
      ethRewardsManager0.address,
      governance.address,
      ethRewardsManagerInitializeCallData,
      { from: proxyDeployerAddress }
    )
    ethRewardsManager = await EthRewardsManager.at(ethRewardsManagerProxy.address)

    // Register ethRewardsManagerProxy
    await registry.addContract(ethRewardsManagerProxyKey, ethRewardsManagerProxy.address, { from: proxyDeployerAddress })

    // Register claimsManager contract as a minter, from the same address that deployed the contract
    await governance.guardianExecuteTransaction(
      tokenRegKey,
      callValue0,
      'addMinter(address)',
      _lib.abiEncode(['address'], [claimsManager.address]),
      { from: guardianAddress }
    )

    // ---- Configuring addresses
    await _lib.configureGovernanceContractAddresses(
      governance,
      governanceKey,
      guardianAddress,
      stakingProxy.address,
      mockStakingCaller.address,
      mockDelegateManager.address
    )

    // ---- Set up staking contract permissions
    await _lib.configureStakingContractAddresses(
      governance,
      guardianAddress,
      stakingProxyKey,
      staking,
      mockStakingCaller.address,
      claimsManagerProxy.address,
      mockDelegateManager.address
    )

    // --- Set up claims manager contract permissions
    await _lib.configureClaimsManagerContractAddresses(
      governance,
      guardianAddress,
      claimsManagerProxyKey,
      claimsManager,
      staking.address,
      mockStakingCaller.address,
      mockDelegateManager.address
    )

    await governance.guardianExecuteTransaction(
      claimsManagerProxyKey,
      callValue0,
      'updateRecurringCommunityFundingAmount(uint256)',
      _lib.abiEncode(['uint256'], [RECURRING_COMMUNITY_FUNDING_AMOUNT]),
      { from: guardianAddress }
    )

    await governance.guardianExecuteTransaction(
      claimsManagerProxyKey,
      callValue0,
      'updateCommunityPoolAddress(address)',
      _lib.abiEncode(['address'], [ethRewardsManagerProxy.address]),
      { from: guardianAddress }
    )
  })

  it('fails when token is not contract, init test', async () => {
    const invalidEthRewardsManagerInitializeCallData = _lib.encodeCall(
      'initialize',
      ['address', 'address', 'address', 'bytes32', 'address[]'],
      [accounts[5], governance.address, mockWormhole.address, recipient, antiAbuseOracleAddresses]
    )
    const ethRewardsManager1 = await EthRewardsManager.new({ from: proxyAdminAddress })
    await _lib.assertRevert(
      AudiusAdminUpgradeabilityProxy.new(
        ethRewardsManager1.address,
        governance.address,
        invalidEthRewardsManagerInitializeCallData,
        { from: proxyDeployerAddress }
      )
    )
  })

  it('fails when wormhole is not contract, init test', async () => {
    const invalidEthRewardsManagerInitializeCallData = _lib.encodeCall(
      'initialize',
      ['address', 'address', 'address', 'bytes32', 'address[]'],
      [token.address, governance.address, accounts[5], recipient, antiAbuseOracleAddresses]
    )
    const ethRewardsManager1 = await EthRewardsManager.new({ from: proxyAdminAddress })
    await _lib.assertRevert(
      AudiusAdminUpgradeabilityProxy.new(
        ethRewardsManager1.address,
        governance.address,
        invalidEthRewardsManagerInitializeCallData,
        { from: proxyDeployerAddress }
      )
    )
  })

  it('governanceAddress', async () => {
    const newGovernance = await _lib.deployGovernance(
      artifacts,
      proxyAdminAddress,
      proxyDeployerAddress,
      registry,
      VOTING_PERIOD,
      EXECUTION_DELAY,
      VOTING_QUORUM_PERCENT,
      guardianAddress
    )

    await _lib.assertRevert(
      ethRewardsManager.setGovernanceAddress(newGovernance.address, { from: accounts[7] }),
      'Only governance'
    )

    await _lib.assertRevert(
      governance.guardianExecuteTransaction(
        ethRewardsManagerProxyKey,
        callValue0,
        'setGovernanceAddress(address)',
        _lib.abiEncode(['address'], [accounts[10]]),
        { from: guardianAddress }
      ),
      'Governance: Transaction failed.'
    )

    await governance.guardianExecuteTransaction(
      ethRewardsManagerProxyKey,
      callValue0,
      'setGovernanceAddress(address)',
      _lib.abiEncode(['address'], [newGovernance.address]),
      { from: guardianAddress }
    )

    assert.equal(await ethRewardsManager.getGovernanceAddress(), newGovernance.address)
  })

  it('antiAbuseOracleAddresses', async () => {
    await _lib.assertRevert(
      ethRewardsManager.setAntiAbuseOracleAddresses([accounts[10], accounts[11], accounts[12]], { from: accounts[7] }),
      'Only governance'
    )

    await governance.guardianExecuteTransaction(
      ethRewardsManagerProxyKey,
      callValue0,
      'setAntiAbuseOracleAddresses(address[])',
      _lib.abiEncode(['address[]'], [[accounts[10], accounts[11], accounts[12]]]),
      { from: guardianAddress }
    )

    assert.deepEqual(await ethRewardsManager.getAntiAbuseOracleAddresses(), [accounts[10], accounts[11], accounts[12]])
  })

  it('recipient', async () => {
    const newRecipient = Buffer.from('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'hex')

    await _lib.assertRevert(
      ethRewardsManager.setRecipientAddress(newRecipient, { from: accounts[7] }),
      'Only governance'
    )

    await governance.guardianExecuteTransaction(
      ethRewardsManagerProxyKey,
      callValue0,
      'setRecipientAddress(bytes32)',
      _lib.abiEncode(['bytes32'], [newRecipient]),
      { from: guardianAddress }
    )

    assert.equal(await ethRewardsManager.getRecipientAddress(), `0x${newRecipient.toString('hex')}`)
  })

  it('transferToSolana', async () => {
    const amount = 100

    await token.transfer(ethRewardsManager.address, amount, { from: tokenOwnerAddress })
    assert.equal((await token.balanceOf(ethRewardsManager.address)).toNumber(), amount)

    const tx = await ethRewardsManager.transferToSolana(1, { from: accounts[7] })

    await expectEvent.inTransaction(tx.tx, MockWormhole, 'LogTokensLocked', {
      targetChain: '1',
      tokenChain: '2',
      tokenDecimals: await token.decimals(),
      token: web3.utils.padLeft(token.address, 64).toLowerCase(),
      sender: web3.utils.padLeft(ethRewardsManager.address, 64).toLowerCase(),
      recipient: `0x${recipient.toString('hex')}`,
      amount: amount.toString(),
      nonce: '1'
    })

    assert.equal((await token.balanceOf(ethRewardsManager.address)).toNumber(), 0)
    assert.equal((await token.balanceOf(mockWormhole.address)).toNumber(), 100)
  })

  it('transferToSolana from claimsManager', async () => {
    await approveTransferAndStake(DEFAULT_AMOUNT, staker)
    let initiateTx = await claimsManager.initiateRound({ from: staker })

    assert.equal(await token.balanceOf(ethRewardsManager.address), RECURRING_COMMUNITY_FUNDING_AMOUNT)

    // Confirm events
    await expectEvent.inTransaction(
      initiateTx.tx,
      ClaimsManager,
      'CommunityRewardsTransferred',
      {
        _transferAddress: ethRewardsManager.address,
        _amount: _lib.toBN(RECURRING_COMMUNITY_FUNDING_AMOUNT)
      }
    )

    const transferToSolanaTx = await governance.guardianExecuteTransaction(
      ethRewardsManagerProxyKey,
      callValue0,
      'transferToSolana(uint32)',
      _lib.abiEncode(['uint32'], [1]),
      { from: guardianAddress }
    )

    await expectEvent.inTransaction(transferToSolanaTx.tx, MockWormhole, 'LogTokensLocked', {
      targetChain: '1',
      tokenChain: '2',
      tokenDecimals: await token.decimals(),
      token: web3.utils.padLeft(token.address, 64).toLowerCase(),
      sender: web3.utils.padLeft(ethRewardsManager.address, 64).toLowerCase(),
      recipient: `0x${recipient.toString('hex')}`,
      amount: RECURRING_COMMUNITY_FUNDING_AMOUNT.toString(),
      nonce: '1'
    })
  })

  it('token', async () => {
    assert.equal(await ethRewardsManager.token(), token.address)
  })
})
