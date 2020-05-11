import * as _lib from './_lib/lib.js'
const encodeCall = require('../utils/encodeCall')

const Registry = artifacts.require('Registry')
const AudiusToken = artifacts.require('AudiusToken')
const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')
const Staking = artifacts.require('Staking')
const MockStakingCaller = artifacts.require('MockStakingCaller')

const claimsManagerProxyKey = web3.utils.utf8ToHex('ClaimsManagerProxy')
const delegateManagerKey = web3.utils.utf8ToHex('DelegateManager')
const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')
const governanceKey = web3.utils.utf8ToHex('Governance')

const DEFAULT_AMOUNT = _lib.audToWeiBN(120)


contract('Staking test', async (accounts) => {
  let registry
  let mockStakingCaller
  let token, staking0, stakingInitializeData, proxy, staking, stakingAddress

  const [deployerAddress, proxyAdminAddress, proxyDeployerAddress] = accounts

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
    token = await AudiusToken.new({ from: deployerAddress })
    await token.initialize()
    registry = await Registry.new()
    await registry.initialize()

    // Create initialization data
    staking0 = await Staking.new({ from: proxyAdminAddress })
    stakingInitializeData = encodeCall(
      'initialize',
      ['address', 'address', 'bytes32', 'bytes32', 'bytes32'],
      [
        token.address,
        registry.address,
        claimsManagerProxyKey,
        delegateManagerKey,
        serviceProviderFactoryKey
      ]
    )

    proxy = await AudiusAdminUpgradeabilityProxy.new(
      staking0.address,
      proxyAdminAddress,
      stakingInitializeData,
      registry.address,
      governanceKey,
      { from: proxyDeployerAddress }
    )

    // Register mock contract as claimsManager, spFactory, delegateManager
    mockStakingCaller = await MockStakingCaller.new()
    await mockStakingCaller.initialize(proxy.address, token.address)
    await registry.addContract(claimsManagerProxyKey, mockStakingCaller.address)
    await registry.addContract(serviceProviderFactoryKey, mockStakingCaller.address)
    await registry.addContract(delegateManagerKey, mockStakingCaller.address)

    // Permission test address as caller
    staking = await Staking.at(proxy.address)
    stakingAddress = staking.address
  })

  it('has correct initial state', async () => {
    assert.equal(await staking.token({ from: accounts[3]}), token.address, 'Token is wrong')
    assert.equal((await staking.totalStaked()).valueOf(), 0, 'Initial total staked amount should be zero')
    assert.equal(await staking.supportsHistory(), true, 'history support should match')
  })

  it('fails staking 0 amount', async () => {
    let staker = accounts[1]
    await token.approve(stakingAddress, 1)
    await _lib.assertRevert(
      mockStakingCaller.stakeFor(
        staker,
        0
      ),
      'STAKING_AMOUNT_ZERO'
    )
  })

  it('fails unstaking more than staked, fails 0', async () => {
    await approveAndStake(DEFAULT_AMOUNT, deployerAddress)
    await _lib.assertRevert(
      mockStakingCaller.unstakeFor(
        deployerAddress,
        DEFAULT_AMOUNT + 1
      ),
      "Cannot decrease greater than current balance"
    )
    await _lib.assertRevert(
      mockStakingCaller.unstakeFor(
        deployerAddress,
        0
      ))
  })

  it('fails staking with insufficient balance', async () => {
    const owner = accounts[1]
    await _lib.assertRevert(approveAndStake(DEFAULT_AMOUNT, owner))
  })

  it('supports history', async () => {
    assert.equal(await staking.supportsHistory(), true, 'It should support History')
  })

  it('stake with single account', async () => {
    let staker = accounts[1]
    // Transfer 1000 tokens to accounts[1]
    await token.transfer(staker, DEFAULT_AMOUNT, { from: deployerAddress })
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
    const staker = accounts[2]
    // Transfer default tokens to account[2]
    await token.transfer(staker, DEFAULT_AMOUNT, { from: deployerAddress })

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
    // Transfer 1000 tokens to accounts[1], accounts[2]
    await token.transfer(accounts[1], DEFAULT_AMOUNT, { from: deployerAddress })
    await token.transfer(accounts[2], DEFAULT_AMOUNT, { from: deployerAddress })

    let initialTotalStaked = await staking.totalStaked()

    // Stake w/both accounts
    await approveAndStake(DEFAULT_AMOUNT, accounts[1])
    await approveAndStake(DEFAULT_AMOUNT, accounts[2])

    let finalTotalStaked = parseInt(await staking.totalStaked())
    let expectedFinalStake = parseInt(initialTotalStaked + (DEFAULT_AMOUNT * 2))
    assert.equal(
      finalTotalStaked,
      expectedFinalStake,
      'Final stake amount must be 2x default stake')
  })

  it('slash account', async () => {
    const account = accounts[1]
    const slashAmount = web3.utils.toBN(DEFAULT_AMOUNT / 2)

    // Transfer & stake
    await token.transfer(account, DEFAULT_AMOUNT, { from: deployerAddress })
    await approveAndStake(DEFAULT_AMOUNT, account)

    // Confirm initial Staking state
    const initialStakeBN = await staking.totalStaked()
    const tokenInitialSupply = await token.totalSupply()
    const initialStakeAmount = parseInt(await staking.totalStakedFor(account))
    assert.equal(initialStakeAmount, DEFAULT_AMOUNT)

    // Fail to slash zero
    await _lib.assertRevert(
      slashAccount(0, account, deployerAddress),
      'STAKING_AMOUNT_ZERO'
    )

    // Slash account's stake
    await slashAccount(slashAmount, account, deployerAddress)

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
    const spAccount1 = accounts[1]
    const spAccount2 = accounts[2]
    const spAccount3 = accounts[3]
    const funderAccount = accounts[4]

    // TODO: Confirm that historic values for a single account can be recalculated by validating with blocknumber
    // Transfer DEFAULLT tokens to accts 1, 2, 3
    await token.transfer(spAccount1, DEFAULT_AMOUNT, { from: deployerAddress })
    await token.transfer(spAccount2, DEFAULT_AMOUNT, { from: deployerAddress })
    await token.transfer(spAccount3, DEFAULT_AMOUNT, { from: deployerAddress })

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
    await token.transfer(funderAccount, FIRST_CLAIM_FUND, { from: deployerAddress })

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
      let staker = accounts[1]
      // Transfer 1000 tokens to accounts[1]
      await token.transfer(staker, DEFAULT_AMOUNT, { from: deployerAddress })
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

    it('stakeRewards called from invalid address, ClaimsManager restriction', async () => {
      let staker = accounts[1]
      // Transfer 1000 tokens to accounts[1]
      await token.transfer(staker, DEFAULT_AMOUNT, { from: deployerAddress })
      await token.approve(stakingAddress, DEFAULT_AMOUNT, { from: staker })
      await _lib.assertRevert(staking.stakeRewards(DEFAULT_AMOUNT, staker), 'Only callable from ClaimsManager')
    })

    it('slash called from invalid address, DelegateManager restrictions', async () => {
      await _lib.assertRevert(
        staking.slash(DEFAULT_AMOUNT, accounts[3], { from: accounts[7] }),
        'Only callable from DelegateManager'
      )
    })

    it('delegate/undelegate called from invalid address, DelegateManager restrictions', async () => {
      let staker = accounts[1]
      let delegator = accounts[2]
      // Transfer 1000 tokens to accounts[1]
      await token.transfer(delegator, DEFAULT_AMOUNT, { from: deployerAddress })
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
      let invalidStakingInitializeData = encodeCall(
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
          proxyAdminAddress,
          invalidStakingInitializeData,
          registry.address,
          governanceKey,
          { from: proxyDeployerAddress }
        )
      )
    })
  })
})
