import * as _lib from '../utils/lib.js'

const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')
const Staking = artifacts.require('Staking')
const MockStakingCaller = artifacts.require('MockStakingCaller')

const claimsManagerProxyKey = web3.utils.utf8ToHex('ClaimsManagerProxy')
const delegateManagerKey = web3.utils.utf8ToHex('DelegateManager')
const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')
const tokenRegKey = web3.utils.utf8ToHex('TokenKey')

const DEFAULT_AMOUNT = _lib.audToWeiBN(120)
const VOTING_PERIOD = 10
const EXECUTION_DELAY = VOTING_PERIOD
const VOTING_QUORUM_PERCENT = 10


contract('Staking test', async (accounts) => {
  let registry, governance
  let mockStakingCaller
  let token, staking0, stakingInitializeData, proxy, staking, stakingAddress

  // intentionally not using acct0 to make sure no TX accidentally succeeds without specifying sender
  const [, proxyAdminAddress, proxyDeployerAddress, staker] = accounts
  const tokenOwnerAddress = proxyDeployerAddress
  const guardianAddress = proxyDeployerAddress

  const approveAndStake = async (amount, staker) => {
    // allow Staking app to move owner tokens
    await token.approve(stakingAddress, amount, { from: staker })
    // stake tokens
    await mockStakingCaller.stakeFor(
      staker,
      amount
    )
  }

  const getStakedAmountForAcct = async (acct) => {
    let stakeValue = (await staking.totalStakedFor(acct)).valueOf()
    // console.log(`${acct} : ${stakeValue}`)
    return parseInt(stakeValue)
  }

  const slashAccount = async (amount, slashAddr, slasherAddress) => {
    return mockStakingCaller.slash(
      amount,
      slashAddr,
      { from: slasherAddress })
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
    // await registry.addContract(governanceKey, governance.address, { from: proxyDeployerAddress })

    // Deploy + register token
    token = await _lib.deployToken(
      artifacts,
      proxyAdminAddress,
      proxyDeployerAddress,
      tokenOwnerAddress,
      governance.address
    )
    await registry.addContract(tokenRegKey, token.address, { from: proxyDeployerAddress })

    // Register mock contract as claimsManager, spFactory, delegateManager
    mockStakingCaller = await MockStakingCaller.new()
    let mockGovAddress = mockStakingCaller.address

    // Create initialization data
    staking0 = await Staking.new({ from: proxyAdminAddress })
    stakingInitializeData = _lib.encodeCall(
      'initialize',
      ['address', 'address'],
      [
        token.address,
        mockGovAddress
      ]
    )

    proxy = await AudiusAdminUpgradeabilityProxy.new(
      staking0.address,
      mockGovAddress,
      stakingInitializeData,
      { from: proxyDeployerAddress }
    )

    await mockStakingCaller.initialize(proxy.address, token.address)
    await registry.addContract(claimsManagerProxyKey, mockStakingCaller.address, { from: proxyDeployerAddress })
    await registry.addContract(serviceProviderFactoryKey, mockStakingCaller.address, { from: proxyDeployerAddress })
    await registry.addContract(delegateManagerKey, mockStakingCaller.address, { from: proxyDeployerAddress })

    // Configure all addresses to mockStakingCaller
    await mockStakingCaller.configurePermissions()

    // Permission test address as caller
    staking = await Staking.at(proxy.address)
    stakingAddress = staking.address
  })

  it.only('Confirm staking fails reinitialization', async () => {
    await _lib.assertRevert(
      staking.initialize(token.address, accounts[14]),
      'Contract instance has already been initialized'
    )
  })

  it('has correct initial state', async () => {
    assert.equal(await staking.token({ from: accounts[13]}), token.address, 'Token is wrong')
    assert.equal((await staking.totalStaked()).valueOf(), 0, 'Initial total staked amount should be zero')
    assert.equal(await staking.supportsHistory(), true, 'history support should match')
  })

  it('fails staking 0 amount', async () => {
    let staker = accounts[10]
    await token.approve(stakingAddress, 1)
    await _lib.assertRevert(
      mockStakingCaller.stakeFor(
        staker,
        0
      ),
      'Zero amount not allowed'
    )
  })

  it('fails unstaking more than staked, fails 0', async () => {
    await approveAndStake(DEFAULT_AMOUNT, proxyDeployerAddress)
    await _lib.assertRevert(
      mockStakingCaller.unstakeFor(
        proxyDeployerAddress,
        DEFAULT_AMOUNT + 1
      ),
      "Cannot decrease greater than current balance"
    )
    await _lib.assertRevert(
      mockStakingCaller.unstakeFor(
        proxyDeployerAddress,
        0
      ))
  })

  it('fails staking with insufficient balance', async () => {
    const owner = accounts[10]
    await _lib.assertRevert(approveAndStake(DEFAULT_AMOUNT, owner))
  })

  it('supports history', async () => {
    assert.equal(await staking.supportsHistory(), true, 'It should support History')
  })

  it('stake with single account', async () => {
    let staker = accounts[10]
    // Transfer 1000 tokens to accounts[1]
    await token.transfer(staker, DEFAULT_AMOUNT, { from: proxyDeployerAddress })
    await token.approve(stakingAddress, DEFAULT_AMOUNT, { from: staker })

    assert.equal(0, await staking.lastStakedFor(staker), 'No stake history expected')

    // stake tokens
    let tx = await mockStakingCaller.stakeFor(
      staker,
      DEFAULT_AMOUNT)
    assert.equal(
      _lib.fromBN(await staking.lastStakedFor(staker)),
      tx.receipt.blockNumber,
      'Expect history update in Staking')

    assert.isTrue(
      (await staking.totalStakedAt(tx.receipt.blockNumber)).eq(DEFAULT_AMOUNT),
      'Default amount expected')
    assert.isTrue(
      (await staking.totalStakedForAt(staker, tx.receipt.blockNumber)).eq(DEFAULT_AMOUNT),
      'Default amount expected')

    assert.isTrue(
      (await staking.totalStaked()).eq(DEFAULT_AMOUNT),
      'Final total stake amount must be default stake'
    )
    assert.isTrue(
      (await staking.totalStakedFor(staker)).eq(DEFAULT_AMOUNT),
      'Account stake value should match default stake'
    )
  })

  it('unstakes', async () => {
    const staker = accounts[10]
    // Transfer default tokens to account[2]
    await token.transfer(staker, DEFAULT_AMOUNT, { from: proxyDeployerAddress })

    const initialOwnerBalance = await token.balanceOf(staker)
    const initialStakingBalance = await token.balanceOf(stakingAddress)

    await approveAndStake(DEFAULT_AMOUNT, staker)

    assert.isTrue((await token.balanceOf(staker)).eq(initialOwnerBalance.sub(DEFAULT_AMOUNT)), 'staker balance should match')
    assert.isTrue((await token.balanceOf(stakingAddress)).eq(initialStakingBalance.add(DEFAULT_AMOUNT)), 'Staking app balance should match')
    assert.isTrue((await staking.totalStakedFor(staker)).eq(DEFAULT_AMOUNT), 'staked value should match')

    // total stake
    assert.equal((await staking.totalStaked()).toString(), DEFAULT_AMOUNT, 'Total stake should match')

    // Unstake default amount
    await mockStakingCaller.unstakeFor(
      staker,
      DEFAULT_AMOUNT
    )

    const finalOwnerBalance = await token.balanceOf(staker)
    const finalStakingBalance = await token.balanceOf(stakingAddress)

    assert.isTrue(finalOwnerBalance.eq(initialOwnerBalance), 'initial and final owner balance should match')
    assert.isTrue(finalStakingBalance.eq(initialStakingBalance), 'initial and final staking balance should match')
  })

  it('stake with multiple accounts', async () => {
    // Transfer 1000 tokens to accounts[10], accounts[11]
    await token.transfer(accounts[10], DEFAULT_AMOUNT, { from: proxyDeployerAddress })
    await token.transfer(accounts[11], DEFAULT_AMOUNT, { from: proxyDeployerAddress })

    let initialTotalStaked = await staking.totalStaked()

    // Stake w/both accounts
    await approveAndStake(DEFAULT_AMOUNT, accounts[10])
    await approveAndStake(DEFAULT_AMOUNT, accounts[11])

    let finalTotalStaked = parseInt(await staking.totalStaked())
    let expectedFinalStake = parseInt(initialTotalStaked + (DEFAULT_AMOUNT * 2))
    assert.equal(
      finalTotalStaked,
      expectedFinalStake,
      'Final stake amount must be 2x default stake')
  })

  it('slash account', async () => {
    const account = accounts[10]
    const slashAmount = web3.utils.toBN(DEFAULT_AMOUNT / 2)

    // Transfer & stake
    await token.transfer(account, DEFAULT_AMOUNT, { from: proxyDeployerAddress })
    await approveAndStake(DEFAULT_AMOUNT, account)

    // Confirm initial Staking state
    const initialStakeBN = await staking.totalStaked()
    const tokenInitialSupply = await token.totalSupply()
    const initialStakeAmount = parseInt(await staking.totalStakedFor(account))
    assert.equal(initialStakeAmount, DEFAULT_AMOUNT)

    // Fail to slash zero
    await _lib.assertRevert(
      slashAccount(0, account, proxyDeployerAddress),
      'Zero amount not allowed'
    )

    // Slash account's stake
    await slashAccount(slashAmount, account, proxyDeployerAddress)

    // Confirm staked value for account
    const finalAccountStake = parseInt(await staking.totalStakedFor(account))
    assert.equal(finalAccountStake, DEFAULT_AMOUNT / 2)

    // Confirm total stake is decreased after slash
    const finalTotalStake = await staking.totalStaked()
    assert.isTrue(
      finalTotalStake.eq(initialStakeBN.sub(slashAmount)),
      'Expect total amount decreased'
    )

    // Confirm token total supply decreased after burn
    assert.equal(
      await token.totalSupply(),
      tokenInitialSupply - slashAmount,
      "ruh roh"
    )
  })

  it('multiple claims, single fund cycle', async () => {
    // Stake initial treasury amount from treasury address
    const spAccount1 = accounts[11]
    const spAccount2 = accounts[12]
    const spAccount3 = accounts[13]
    const funderAccount = accounts[14]

    // TODO: Confirm that historic values for a single account can be recalculated by validating with blocknumber
    // Transfer DEFAULLT tokens to accts 1, 2, 3
    await token.transfer(spAccount1, DEFAULT_AMOUNT, { from: proxyDeployerAddress })
    await token.transfer(spAccount2, DEFAULT_AMOUNT, { from: proxyDeployerAddress })
    await token.transfer(spAccount3, DEFAULT_AMOUNT, { from: proxyDeployerAddress })

    // Stake with account 1
    // Treasury - 120
    await approveAndStake(DEFAULT_AMOUNT, spAccount1)

    // Stake with account 2
    await approveAndStake(DEFAULT_AMOUNT, spAccount2)

    let currentTotalStake = parseInt(await staking.totalStaked())
    let expectedTotalStake = DEFAULT_AMOUNT * 2

    assert.equal(
      currentTotalStake,
      expectedTotalStake,
      'Final stake amount must be 2x default stake')

    assert.equal(await staking.lastClaimedFor(spAccount1), 0, 'No claim history expected')
    assert.equal(await staking.lastClaimedFor(spAccount2), 0, 'No claim history expected')

    let FIRST_CLAIM_FUND = _lib.audToWeiBN(120)

    // Transfer 120AUD tokens to staking contract
    await token.transfer(funderAccount, FIRST_CLAIM_FUND, { from: proxyDeployerAddress })

    // allow Staking app to move owner tokens
    let sp1Rewards = FIRST_CLAIM_FUND.div(web3.utils.toBN(2))
    let sp2Rewards = sp1Rewards
    await token.approve(mockStakingCaller.address, sp1Rewards, { from: funderAccount })
    let tx = await mockStakingCaller.stakeRewards(sp1Rewards, spAccount1, { from: funderAccount })
    assert.isTrue(
      (await staking.lastClaimedFor(spAccount1)).eq(_lib.toBN(tx.receipt.blockNumber)),
      'Updated claim history expected')

    await token.approve(mockStakingCaller.address, sp2Rewards, { from: funderAccount })
    tx = await mockStakingCaller.stakeRewards(sp2Rewards, spAccount2, { from: funderAccount })
    assert.isTrue(
      (await staking.lastClaimedFor(spAccount2)).eq(_lib.toBN(tx.receipt.blockNumber)),
      'Updated claim history expected')

    // Initial val should be first claim fund / 2
    let expectedValueAfterFirstFund = DEFAULT_AMOUNT.add(sp1Rewards)

    // Confirm value added to account 1
    let acct1StakeAfterFund = await getStakedAmountForAcct(spAccount1)
    assert.isTrue(
      expectedValueAfterFirstFund.eq(
        web3.utils.toBN(acct1StakeAfterFund)),
      'Expected stake increase for acct 1')

    let acct2StakeAfterFund = await getStakedAmountForAcct(spAccount2)
    assert.isTrue(
      expectedValueAfterFirstFund.eq(
        web3.utils.toBN(acct2StakeAfterFund)),
      'Expected stake increase for acct 2')

    // Stake with account 3, after funding round
    await approveAndStake(DEFAULT_AMOUNT, spAccount3)
    // Confirm updated multiplier adjusts stake accurately
    let acct3Stake = await getStakedAmountForAcct(spAccount3)
    assert.isTrue(
      DEFAULT_AMOUNT.eq(
        web3.utils.toBN(acct3Stake)),
      'Expected stake increase for acct 2')
  })

  describe('caller restriction verification', async () => {
    it('stakeFor, unstakeFor called from invalid address, ServiceProviderFactory restrictions', async () => {
      let staker = accounts[11]
      // Transfer 1000 tokens to accounts[11]
      await token.transfer(staker, DEFAULT_AMOUNT, { from: proxyDeployerAddress })
      await token.approve(stakingAddress, DEFAULT_AMOUNT, { from: staker })

      // stake tokens
      await _lib.assertRevert(
        staking.stakeFor(
          staker,
          DEFAULT_AMOUNT
        ),
        'Only callable from ServiceProviderFactory'
      )
      // unstake tokens
      await _lib.assertRevert(
        staking.unstakeFor(
          staker,
          DEFAULT_AMOUNT
        ),
        'Only callable from ServiceProviderFactory'
      )
    })

    it('Fail to set service addresses from non-governance contract, init test', async () => {
      await _lib.assertRevert(
        staking.setGovernanceAddress(_lib.addressZero),
        'Only governance'
      )
      await _lib.assertRevert(
        staking.setClaimsManagerAddress(_lib.addressZero),
        'Only governance'
      )
      await _lib.assertRevert(
        staking.setDelegateManagerAddress(_lib.addressZero),
        'Only governance'
      )
      await _lib.assertRevert(
        staking.setServiceProviderFactoryAddress(_lib.addressZero),
        'Only governance'
      )
      await _lib.assertRevert(
        staking.updateClaimHistory(0, accounts[5]),
        'Only callable from ClaimsManager or Staking.sol'
      )
      let invalidStakingInitializeData = _lib.encodeCall(
        'initialize',
        ['address', 'address'],
        [
          accounts[5],
          mockStakingCaller.address
        ]
      )
      let staking1 = await Staking.new({ from: proxyAdminAddress })
      // Confirm invalid token address fails on init
      await _lib.assertRevert(
        AudiusAdminUpgradeabilityProxy.new(
          staking1.address,
          mockStakingCaller.address,
          invalidStakingInitializeData,
          { from: proxyDeployerAddress }
        ),
      )
    })

    it('stakeRewards called from invalid address, ClaimsManager restriction', async () => {
      let staker = accounts[11]
      // Transfer 1000 tokens to accounts[11]
      await token.transfer(staker, DEFAULT_AMOUNT, { from: proxyDeployerAddress })
      await token.approve(stakingAddress, DEFAULT_AMOUNT, { from: staker })
      await _lib.assertRevert(staking.stakeRewards(DEFAULT_AMOUNT, staker), 'Only callable from ClaimsManager')
    })

    it('slash called from invalid address, DelegateManager restrictions', async () => {
      await _lib.assertRevert(
        staking.slash(DEFAULT_AMOUNT, accounts[13], { from: accounts[7] }),
        'Only callable from DelegateManager'
      )
    })

    it('delegate/undelegate called from invalid address, DelegateManager restrictions', async () => {
      let staker = accounts[11]
      let delegator = accounts[12]
      // Transfer 1000 tokens to accounts[11]
      await token.transfer(delegator, DEFAULT_AMOUNT, { from: proxyDeployerAddress })
      await token.approve(stakingAddress, DEFAULT_AMOUNT, { from: delegator })
      await _lib.assertRevert(
        staking.delegateStakeFor(staker, delegator, DEFAULT_AMOUNT),
        'Only callable from DelegateManager'
      )
      await _lib.assertRevert(
        staking.undelegateStakeFor(staker, delegator, DEFAULT_AMOUNT),
        'Only callable from DelegateManager'
      )
    })

    it('invalid token address', async () => {
      let testStaking = await Staking.new({ from: proxyAdminAddress })
      let invalidStakingInitializeData = _lib.encodeCall(
        'initialize',
        ['address', 'address', 'bytes32', 'bytes32', 'bytes32'],
        [
          accounts[4],
          registry.address,
          claimsManagerProxyKey,
          delegateManagerKey,
          serviceProviderFactoryKey
        ]
      )
      await _lib.assertRevert(
        AudiusAdminUpgradeabilityProxy.new(
          testStaking.address,
          mockStakingCaller.address,
          invalidStakingInitializeData,
          { from: proxyDeployerAddress }
        )
      )
    })
  })
})
