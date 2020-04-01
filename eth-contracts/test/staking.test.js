import * as _lib from './_lib/lib.js'
const encodeCall = require('./encodeCall')
const AudiusToken = artifacts.require('AudiusToken')
const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy')
const Staking = artifacts.require('Staking')

const fromBn = n => parseInt(n.valueOf(), 10)
const getTokenBalance = async (token, account) => fromBn(await token.balanceOf(account))

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
  let treasuryAddress = accounts[0]
  let testStakingCallerAddress = accounts[6] // Dummy stand in for sp factory in actual deployment
  let proxyOwner = treasuryAddress
  let proxy
  let impl0
  let staking
  let token
  let stakingAddress
  let tokenAddress

  const DEFAULT_TREASURY_AMOUNT = DEFAULT_AMOUNT * 10
  const EMPTY_STRING = ''

  const approveAndStake = async (amount, staker) => {
    // allow Staking app to move owner tokens
    await token.approve(stakingAddress, amount, { from: staker })
    // stake tokens
    await staking.stakeFor(
      staker,
      amount,
      web3.utils.utf8ToHex(EMPTY_STRING),
      { from: testStakingCallerAddress })
  }

  const getStakedAmountForAcct = async (acct) => {
    let stakeValue = (await staking.totalStakedFor(acct)).valueOf()
    // console.log(`${acct} : ${stakeValue}`)
    return parseInt(stakeValue)
  }

  const slashAccount = async (amount, slashAddr, slasherAddress) => {
    return await staking.slash(
      amount,
      slashAddr,
      { from: slasherAddress })
  }

  beforeEach(async () => {
    proxy = await OwnedUpgradeabilityProxy.new({ from: proxyOwner })
    token = await AudiusToken.new({ from: treasuryAddress })
    tokenAddress = token.address

    impl0 = await Staking.new()
    // Create initialization data
    let initializeData = encodeCall(
      'initialize',
      ['address', 'address'],
      [token.address, treasuryAddress])

    await proxy.upgradeToAndCall(
      impl0.address,
      initializeData,
      { from: proxyOwner })

    staking = await Staking.at(proxy.address)
    // Reset min for test purposes

    stakingAddress = staking.address

    // Permission test address as caller
    await staking.setStakingOwnerAddress(testStakingCallerAddress, { from: treasuryAddress })
  })
  it('has correct initial state', async () => {
    assert.equal(await staking.token(), tokenAddress, 'Token is wrong')
    assert.equal((await staking.totalStaked()).valueOf(), 0, 'Initial total staked amount should be zero')
    assert.equal(await staking.supportsHistory(), true, 'history support should match')
  })

  it('fails staking 0 amount', async () => {
    await token.approve(stakingAddress, 1)
    await _lib.assertRevert(staking.stake(0, web3.utils.utf8ToHex(EMPTY_STRING)))
  })

  it('fails unstaking more than staked', async () => {
    await approveAndStake(DEFAULT_AMOUNT, treasuryAddress)
    await _lib.assertRevert(staking.unstake(DEFAULT_AMOUNT + 1, web3.utils.utf8ToHex(EMPTY_STRING)))
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
    let tx = await staking.stakeFor(
      staker,
      DEFAULT_AMOUNT,
      web3.utils.utf8ToHex(EMPTY_STRING),
      { from: testStakingCallerAddress })

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
    await staking.unstake(
      DEFAULT_AMOUNT,
      web3.utils.utf8ToHex(EMPTY_STRING),
      { from: staker }
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

  it('slash functioning as expected', async () => {
    // Transfer 1000 tokens to accounts[1], accounts[2]
    await token.transfer(accounts[1], DEFAULT_AMOUNT, { from: treasuryAddress })
    await token.transfer(accounts[2], DEFAULT_AMOUNT, { from: treasuryAddress })

    // Stake w/both accounts
    await approveAndStake(DEFAULT_AMOUNT, accounts[1])
    await approveAndStake(DEFAULT_AMOUNT, accounts[2])

    let initialStakeBN = await staking.totalStaked()
    let initialTotalStake = parseInt(initialStakeBN)
    let initialStakeAmount = parseInt(await staking.totalStakedFor(accounts[1]))
    assert.equal(initialStakeAmount, DEFAULT_AMOUNT)

    let slashAmount = web3.utils.toBN(DEFAULT_AMOUNT / 2)

    // Slash 1/2 value from treasury
    await slashAccount(
      slashAmount,
      accounts[1],
      treasuryAddress)

    // Confirm staked value for account
    let finalAccountStake = parseInt(await staking.totalStakedFor(accounts[1]))
    assert.equal(finalAccountStake, DEFAULT_AMOUNT / 2)

    // Confirm total stake is decreased after slash
    let finalTotalStake = await staking.totalStaked()
    assert.isTrue(
      finalTotalStake.eq(initialStakeBN.sub(slashAmount)),
      'Expect total amount decreased')
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
    await token.approve(stakingAddress, sp1Rewards, { from: funderAccount })
    let receipt = await staking.stakeRewards(sp1Rewards, spAccount1, { from: funderAccount })

    await token.approve(stakingAddress, sp2Rewards, { from: funderAccount })
    receipt = await staking.stakeRewards(sp2Rewards, spAccount2, { from: funderAccount })

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
