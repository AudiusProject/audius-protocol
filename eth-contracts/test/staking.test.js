import * as _lib from './_lib/lib.js'
const encodeCall = require('./encodeCall')
const AudiusToken = artifacts.require('AudiusToken')
const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy')
const Staking = artifacts.require('Staking')

const fromBn = n => parseInt(n.valueOf(), 10)
const getTokenBalance = async (token, account) => fromBn(await token.balanceOf(account))
const claimBlockDiff = 46000

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

  const DEFAULT_AMOUNT = 120
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

  const approveAndFundNewClaim = async (amount, from) => {
    // allow Staking app to move owner tokens
    await token.approve(stakingAddress, amount, { from })
    let receipt = await staking.fundNewClaim(amount, { from })
    // console.log(receipt)
    return receipt
  }

  const claimStakingReward = async (from) => {
    let tx = await staking.makeClaim({ from })
    let claimArgs = tx.logs.find(log => log.event === 'Claimed').args
    claimArgs.amountClaimedInt = claimArgs.amountClaimed.toNumber()
    claimArgs.blockNumber = tx.receipt.blockNumber
    return claimArgs
  }

  const getLatestBlock = async () => {
    let block = await web3.eth.getBlock('latest')
    // console.log(`Latest block: ${block.number}`)
    return parseInt(block.number)
  }

  const getStakedAmountForAcct = async (acct) => {
    let stakeValue = (await staking.totalStakedFor(acct)).valueOf()
    // console.log(`${acct} : ${stakeValue}`)
    return parseInt(stakeValue)
  }

  const getInstance = (receipt) => {
    return receipt.logs.find(log => log.event === 'NewStaking').args.instance
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
    await staking.setMinStakeAmount(0)

    stakingAddress = staking.address

    // Permission test address as caller
    await staking.setStakingOwnerAddress(testStakingCallerAddress, { from: treasuryAddress })
  })

  it('has correct initial state', async () => {
    assert.equal(await staking.token(), tokenAddress, 'Token is wrong')
    assert.equal((await staking.totalStaked()).valueOf(), 0, 'Initial total staked amount should be zero')
    assert.equal(await staking.supportsHistory(), true, 'history support should match')
  })

  it('stakes', async () => {
    const owner = accounts[0]
    const initialOwnerBalance = await getTokenBalance(token, owner)
    const initialStakingBalance = await getTokenBalance(token, stakingAddress)

    await approveAndStake(DEFAULT_AMOUNT, treasuryAddress)

    const finalOwnerBalance = await getTokenBalance(token, owner)
    const finalStakingBalance = await getTokenBalance(token, stakingAddress)
    assert.equal(finalOwnerBalance, initialOwnerBalance - DEFAULT_AMOUNT, 'owner balance should match')
    assert.equal(finalStakingBalance, initialStakingBalance + DEFAULT_AMOUNT, 'Staking app balance should match')
    assert.equal((await staking.totalStakedFor(owner)).valueOf(), DEFAULT_AMOUNT, 'staked value should match')
    // total stake
    assert.equal((await staking.totalStaked()).toString(), DEFAULT_AMOUNT, 'Total stake should match')
  })

  it('unstakes', async () => {
    const owner = accounts[0]
    const initialOwnerBalance = await getTokenBalance(token, owner)
    const initialStakingBalance = await getTokenBalance(token, stakingAddress)

    await approveAndStake(DEFAULT_AMOUNT, treasuryAddress)

    const tmpOwnerBalance = await getTokenBalance(token, owner)
    const tmpStakingBalance = await getTokenBalance(token, stakingAddress)
    assert.equal(tmpOwnerBalance, initialOwnerBalance - DEFAULT_AMOUNT, 'owner balance should match')
    assert.equal(tmpStakingBalance, initialStakingBalance + DEFAULT_AMOUNT, 'Staking app balance should match')
    assert.equal((await staking.totalStakedFor(owner)).valueOf(), DEFAULT_AMOUNT, 'staked value should match')

    // total stake
    assert.equal((await staking.totalStaked()).toString(), DEFAULT_AMOUNT, 'Total stake should match')

    // Unstake default amount
    await staking.unstake(DEFAULT_AMOUNT, web3.utils.utf8ToHex(EMPTY_STRING))

    const finalOwnerBalance = await getTokenBalance(token, owner)
    const finalStakingBalance = await getTokenBalance(token, stakingAddress)

    assert.equal(finalOwnerBalance, initialOwnerBalance, 'initial and final owner balance should match')
    assert.equal(finalStakingBalance, initialStakingBalance, 'initial and final staking balance should match')
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

  it('configures staking bounds', async () => {
    let newMin = 10000
    await staking.setMinStakeAmount(newMin)
    let newMax = 3000000
    await staking.setMaxStakeAmount(newMax)

    let finalMin = await staking.getMinStakeAmount()
    let finalMax = await staking.getMaxStakeAmount()
    assert.equal(newMin, finalMin, 'Expect updated min stake')
    assert.equal(newMax, finalMax, 'Expect updated min stake')

    // Confirm non-treasury address call reverts
    _lib.assertRevert(staking.setMinStakeAmount(newMin + 10, { from: accounts[3] }))
    _lib.assertRevert(staking.setMaxStakeAmount(newMax + 10, { from: accounts[3] }))
  })

  it('stake with multiple accounts', async () => {
    // Transfer 1000 tokens to accounts[1]
    await token.transfer(accounts[1], 1000, { from: treasuryAddress })

    // Transfer 1000 tokens to accounts[2]
    await token.transfer(accounts[2], 1000, { from: treasuryAddress })

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
    // Set min stake to 0 for testing
    await staking.setMinStakeAmount(0)

    // Transfer 1000 tokens to accounts[1]
    // Transfer 1000 tokens to accounts[2]
    await token.transfer(accounts[1], 1000, { from: treasuryAddress })
    await token.transfer(accounts[2], 1000, { from: treasuryAddress })

    // Stake w/both accounts
    await approveAndStake(DEFAULT_AMOUNT, accounts[1])
    await approveAndStake(DEFAULT_AMOUNT, accounts[2])

    let initialTotalStake = parseInt(await staking.totalStaked())

    let initialStakeAmount = parseInt(await staking.totalStakedFor(accounts[1]))
    assert.equal(initialStakeAmount, DEFAULT_AMOUNT)

    let slashAmount = DEFAULT_AMOUNT / 2
    // Slash 1/2 value from treasury
    await slashAccount(
      slashAmount,
      accounts[1],
      treasuryAddress)

    // Confirm staked value
    let finalStakeAmt = parseInt(await staking.totalStakedFor(accounts[1]))
    assert.equal(finalStakeAmt, DEFAULT_AMOUNT / 2)

    // Confirm total stake is unchanged after slash
    assert.equal(
      initialTotalStake,
      await staking.totalStaked(),
      'Total amount unchanged')
  })

  it('new fund cycle resets block difference', async () => {
    // Stake initial treasury amount from treasury address
    const spAccount1 = accounts[1]
    const spAccount2 = accounts[2]
    const spAccount3 = accounts[3]
    const funderAccount = accounts[4]

    // Transfer 1000 tokens to accounts[1]
    await token.transfer(spAccount1, 1000, { from: treasuryAddress })

    // Transfer 1000 tokens to accounts[2]
    await token.transfer(spAccount2, 1000, { from: treasuryAddress })

    // Transfer 1000 tokens to accounts[3]
    await token.transfer(spAccount3, 1000, { from: treasuryAddress })

    // Transfer 100,000 tokens to funder
    await token.transfer(funderAccount, 10000, { from: treasuryAddress })

    // Stake with account 1
    await approveAndStake(DEFAULT_AMOUNT, spAccount1)
    // let initialSP1Stake = await getStakedAmountForAcct(spAccount1)

    // Stake with account 2
    await approveAndStake(DEFAULT_AMOUNT, spAccount2)

    const INITIAL_FUNDING = 5000
    await approveAndFundNewClaim(INITIAL_FUNDING, funderAccount)

    // Claim for acct 1
    let claimResult1 = await claimStakingReward(spAccount1)
    // console.dir(claimResult1, { depth: 5 })
    let block1 = claimResult1.blockNumber

    // Confirm claim without block diff reached reverts
    _lib.assertRevert(claimStakingReward(spAccount1))

    let block2 = await getLatestBlock()
    assert.isTrue(
      (block2 - block1) < claimBlockDiff,
      'Block difference not yet met')

    // Re-fund claim
    await approveAndFundNewClaim(INITIAL_FUNDING, funderAccount)

    // Confirm claim works despite block difference not being met, due to new funding
    let claimResult2 = await claimStakingReward(spAccount1)
    let block3 = claimResult2.blockNumber

    assert.isTrue(
      (block3 - block1) < claimBlockDiff,
      'Claim block difference not met')

    assert.isTrue(
      claimResult2.amountClaimedInt > 0,
      'Expect successful claim after re-funding')
  })

  it('multiple claims, single fund cycle', async () => {
    // Stake initial treasury amount from treasury address
    const spAccount1 = accounts[1]
    const spAccount2 = accounts[2]
    const spAccount3 = accounts[3]
    const funderAccount = accounts[4]

    // Transfer 1000 tokens to accounts[1]
    await token.transfer(spAccount1, 1000, { from: treasuryAddress })

    // Transfer 1000 tokens to accounts[2]
    await token.transfer(spAccount2, 1000, { from: treasuryAddress })

    // Transfer 1000 tokens to accounts[3]
    await token.transfer(spAccount3, 1000, { from: treasuryAddress })

    // Transfer 100,000 tokens to funder
    await token.transfer(funderAccount, 10000, { from: treasuryAddress })

    // Stake with account 1
    // Treasury - 120
    await approveAndStake(DEFAULT_AMOUNT, spAccount1)

    let initiallyStakedAcct1 = await getStakedAmountForAcct(spAccount1)

    // Stake with account 2
    // Treasury - 240
    await approveAndStake(DEFAULT_AMOUNT, spAccount2)

    let currentTotalStake = parseInt(await staking.totalStaked())
    let expectedTotalStake = DEFAULT_AMOUNT * 2

    assert.equal(
      currentTotalStake,
      expectedTotalStake,
      'Final stake amount must be 2x default stake')

    // Confirm claim can not be made prior to claim funded
    _lib.assertRevert(claimStakingReward(spAccount1))

    // Transfer funds for claiming to contract
    const INITIAL_FUNDING = 5000
    await approveAndFundNewClaim(INITIAL_FUNDING, funderAccount)

    // Stake with account 3, A few blocks after claimBlock has been set
    await approveAndStake(DEFAULT_AMOUNT, spAccount3)

    // Claim for acct 1
    let claimResult1 = await claimStakingReward(spAccount1)
    let finallyStakedAcct1 = (await staking.totalStakedFor(spAccount1)).valueOf()

    // Confirm claim without block diff reached reverts
    _lib.assertRevert(claimStakingReward(spAccount1))

    assert.equal(
      parseInt(initiallyStakedAcct1) + claimResult1.amountClaimedInt,
      finallyStakedAcct1,
      'Expected stake amount')

    // Confirm no claim is awarded to account 3 when requested since no stake was present
    let claimAccount3 = await claimStakingReward(spAccount3)
    assert.equal(claimAccount3.amountClaimedInt, 0, 'Zero funds expected for sp 3 staking')

    // Claim for account 2
    let claimAccount2 = await claimStakingReward(spAccount2)
    assert.equal(INITIAL_FUNDING / 2, claimAccount2.amountClaimedInt, 'Expected 1/2 initial treasury value claim for account 2')

    let finalTreasuryValue = parseInt(await staking.totalStakedFor(treasuryAddress))
    assert.equal(
      finalTreasuryValue,
      0,
      'Expect fund exhaustion from treasury')
  })

  /*
  context('History', async () => {
    const owner = accounts[0]

    // TODO: Consume mock and implement below history tests

    it('has correct "last staked for"', async () => {
      const blockNumber = await staking.getBlockNumberPublic()
      const lastStaked = blockNumber + 5
      await staking.setBlockNumber(lastStaked)
      await approveAndStake()
      assert.equal(await staking.lastStakedFor(owner), lastStaked, 'Last staked for should match')
    })

    it('has correct "total staked for at"', async () => {
      const beforeBlockNumber = await staking.getBlockNumberPublic()
      const lastStaked = beforeBlockNumber + 5
      await staking.setBlockNumber(lastStaked)
      await approveAndStake()
      assert.equal(await staking.totalStakedForAt(owner, beforeBlockNumber), 0, "Staked for at before staking should match")
      assert.equal(await staking.totalStakedForAt(owner, lastStaked), DEFAULT_AMOUNT, "Staked for after staking should match")
    })
  })
  */
})
