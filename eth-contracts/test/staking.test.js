import * as _lib from './_lib/lib.js'
const encodeCall = require('../utils/encodeCall')

const Registry = artifacts.require('Registry')
const AudiusToken = artifacts.require('AudiusToken')
const AdminUpgradeabilityProxy = artifacts.require('AdminUpgradeabilityProxy')
const Staking = artifacts.require('Staking')
const MockStakingCaller = artifacts.require('MockStakingCaller')

const fromBn = n => parseInt(n.valueOf(), 10)
const getTokenBalance = async (token, account) => fromBn(await token.balanceOf(account))

const claimsManagerProxyKey = web3.utils.utf8ToHex('ClaimsManagerProxy')
const delegateManagerKey = web3.utils.utf8ToHex('DelegateManager')
const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')

const toWei = (aud) => {
  let amountInAudWei = web3.utils.toWei(
    aud.toString(),
    'ether'
  )

  let amountInAudWeiBN = web3.utils.toBN(amountInAudWei)
  return amountInAudWeiBN
}

const DEFAULT_AMOUNT = toWei(120)

contract('Staking test', async (accounts) => {
  let registry
  let mockStakingCaller
  let token, staking0, stakingInitializeData, proxy, staking, stakingAddress

  const [treasuryAddress, proxyAdminAddress, proxyDeployerAddress] = accounts

  const EMPTY_STRING = ''

  const approveAndStake = async (amount, staker) => {
    // allow Staking app to move owner tokens
    await token.approve(stakingAddress, amount, { from: staker })
    // stake tokens
    await mockStakingCaller.stakeFor(
      staker,
      amount,
      web3.utils.utf8ToHex(EMPTY_STRING))
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
    token = await AudiusToken.new({ from: treasuryAddress })
    await token.initialize()
    registry = await Registry.new()
    await registry.initialize()

    // Create initialization data
    staking0 = await Staking.new({ from: proxyAdminAddress })
    stakingInitializeData = encodeCall(
      'initialize',
      ['address', 'address', 'address', 'bytes32', 'bytes32', 'bytes32'],
      [
        token.address,
        treasuryAddress,
        registry.address,
        claimsManagerProxyKey,
        delegateManagerKey,
        serviceProviderFactoryKey
      ]
    )

    proxy = await AdminUpgradeabilityProxy.new(
      staking0.address,
      proxyAdminAddress,
      stakingInitializeData,
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
        0,
        web3.utils.utf8ToHex(EMPTY_STRING)
      ),
      "STAKING_AMOUNT_ZERO"
    )
  })

  it('fails unstaking more than staked, fails 0', async () => {
    await approveAndStake(DEFAULT_AMOUNT, treasuryAddress)
    await _lib.assertRevert(
      mockStakingCaller.unstakeFor(
        treasuryAddress,
        DEFAULT_AMOUNT + 1,
        web3.utils.utf8ToHex(EMPTY_STRING)
      ),
      "Cannot decrease greater than current balance"
    )
    await _lib.assertRevert(
      mockStakingCaller.unstakeFor(
        treasuryAddress,
        0,
        web3.utils.utf8ToHex(EMPTY_STRING)
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
    await token.transfer(staker, DEFAULT_AMOUNT, { from: treasuryAddress })
    await token.approve(stakingAddress, DEFAULT_AMOUNT, { from: staker })

    // stake tokens
    await mockStakingCaller.stakeFor(
      staker,
      DEFAULT_AMOUNT,
      web3.utils.utf8ToHex(EMPTY_STRING))

    let finalTotalStaked = parseInt(await staking.totalStaked())
    assert.equal(
      finalTotalStaked,
      DEFAULT_AMOUNT,
      'Final total stake amount must be default stake')
    assert.equal(
      fromBn(await staking.totalStakedFor(staker)),
      DEFAULT_AMOUNT,
      'Account stake value should match default stake')
  })

  it('unstakes', async () => {
    const staker = accounts[2]
    // Transfer default tokens to account[2]
    await token.transfer(staker, DEFAULT_AMOUNT, { from: treasuryAddress })

    const initialOwnerBalance = await getTokenBalance(token, staker)
    const initialStakingBalance = await getTokenBalance(token, stakingAddress)

    await approveAndStake(DEFAULT_AMOUNT, staker)

    const tmpOwnerBalance = await getTokenBalance(token, staker)
    const tmpStakingBalance = await getTokenBalance(token, stakingAddress)
    assert.equal(tmpOwnerBalance, initialOwnerBalance - DEFAULT_AMOUNT, 'staker balance should match')
    assert.equal(tmpStakingBalance, initialStakingBalance + DEFAULT_AMOUNT, 'Staking app balance should match')
    assert.equal(fromBn(await staking.totalStakedFor(staker)), DEFAULT_AMOUNT, 'staked value should match')

    // total stake
    assert.equal((await staking.totalStaked()).toString(), DEFAULT_AMOUNT, 'Total stake should match')

    // Unstake default amount
    await mockStakingCaller.unstakeFor(
      staker,
      DEFAULT_AMOUNT,
      web3.utils.utf8ToHex(EMPTY_STRING)
    )

    const finalOwnerBalance = await getTokenBalance(token, staker)
    const finalStakingBalance = await getTokenBalance(token, stakingAddress)

    assert.equal(finalOwnerBalance, initialOwnerBalance, 'initial and final staker balance should match')
    assert.equal(finalStakingBalance, initialStakingBalance, 'initial and final staking balance should match')
  })

  it('stake with multiple accounts', async () => {
    // Transfer 1000 tokens to accounts[1], accounts[2]
    await token.transfer(accounts[1], DEFAULT_AMOUNT, { from: treasuryAddress })
    await token.transfer(accounts[2], DEFAULT_AMOUNT, { from: treasuryAddress })

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
    await token.transfer(account, DEFAULT_AMOUNT, { from: treasuryAddress })
    await approveAndStake(DEFAULT_AMOUNT, account)

    // Confirm initial Staking state
    const initialStakeBN = await staking.totalStaked()
    const tokenInitialSupply = await token.totalSupply()
    const initialStakeAmount = parseInt(await staking.totalStakedFor(account))
    assert.equal(initialStakeAmount, DEFAULT_AMOUNT)

    // Slash account's stake
    await slashAccount(slashAmount, account, treasuryAddress)

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
    await token.transfer(spAccount1, DEFAULT_AMOUNT, { from: treasuryAddress })
    await token.transfer(spAccount2, DEFAULT_AMOUNT, { from: treasuryAddress })
    await token.transfer(spAccount3, DEFAULT_AMOUNT, { from: treasuryAddress })

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

    let FIRST_CLAIM_FUND = toWei(120)

    // Transfer 120AUD tokens to staking contract
    await token.transfer(funderAccount, FIRST_CLAIM_FUND, { from: treasuryAddress })

    // allow Staking app to move owner tokens
    let sp1Rewards = FIRST_CLAIM_FUND.div(web3.utils.toBN(2))
    let sp2Rewards = sp1Rewards
    await token.approve(mockStakingCaller.address, sp1Rewards, { from: funderAccount })
    let receipt = await mockStakingCaller.stakeRewards(sp1Rewards, spAccount1, { from: funderAccount })

    await token.approve(mockStakingCaller.address, sp2Rewards, { from: funderAccount })
    receipt = await mockStakingCaller.stakeRewards(sp2Rewards, spAccount2, { from: funderAccount })

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
})
