import * as _lib from './_lib/lib.js'
const encodeCall = require('./encodeCall')

const Registry = artifacts.require('Registry')
const AudiusToken = artifacts.require('AudiusToken')
const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy')
const Staking = artifacts.require('Staking')
const Governance = artifacts.require('Governance')

const ownedUpgradeabilityProxyKey = web3.utils.utf8ToHex('OwnedUpgradeabilityProxy')

/** Helper functions */

const fromBn = n => parseInt(n.valueOf(), 10)

const audToWei = (aud) => {
  return web3.utils.toBN(
    web3.utils.toWei(
      aud.toString(), 'ether'
    )
  )
}

contract('Governance test', async (accounts) => {
  let proxyC
  let tokenC
  let stakingC
  let registryC
  let governanceC

  const votingPeriod = 10
  const votingQuorum = 1
  const defaultStake = audToWei(1000)
  const proposalDescription = "TestDescription"

  const treasuryAddress = accounts[0]
  const testStakingCallerAddress = accounts[9] // Dummy stand in for SP factory in actual deployment
  const protocolOwnerAddress = treasuryAddress

  const Outcome = Object.freeze({
    InProgress: 0,
    No: 1,
    Yes: 2,
    Invalid: 3
  })
  const Vote = Object.freeze({
    None: 0,
    No: 1,
    Yes: 2
  })

  const approveAndStake = async (amount, staker) => {
    // Allow Staking app to move owner tokens
    await tokenC.approve(stakingC.address, amount, { from: staker })
    // Stake tokens
    await stakingC.stakeFor(
      staker,
      amount,
      web3.utils.utf8ToHex(''),
      { from: testStakingCallerAddress })
  }

  /**
   * Deploy Registry, OwnedUpgradeabilityProxy, AudiusToken, Staking
   * Deploy Governance
   */
  beforeEach(async () => {
    registryC = await Registry.new()
    proxyC = await OwnedUpgradeabilityProxy.new({ from: protocolOwnerAddress })
    await registryC.addContract(ownedUpgradeabilityProxyKey, proxyC.address)

    tokenC = await AudiusToken.new({ from: treasuryAddress })

    const impl0 = await Staking.new()
    // Create initialization data
    const initializeData = encodeCall(
      'initialize',
      ['address', 'address'],
      [tokenC.address, treasuryAddress]
    )

    // Transfer 1000 tokens to accounts[1] and accounts[2]
    await tokenC.transfer(accounts[1], defaultStake, { from: treasuryAddress })
    await tokenC.transfer(accounts[2], defaultStake, { from: treasuryAddress })

    // Initialize staking contract
    await proxyC.upgradeToAndCall(
      impl0.address,
      initializeData,
      { from: protocolOwnerAddress }
    )

    stakingC = await Staking.at(proxyC.address)

    // Permission test address as caller
    await stakingC.setStakingOwnerAddress(testStakingCallerAddress, { from: protocolOwnerAddress })

    // Set up initial stakes
    await approveAndStake(defaultStake, accounts[1])
    await approveAndStake(defaultStake, accounts[2])

    // Deploy Governance contract
    governanceC = await Governance.new(
      registryC.address,
      ownedUpgradeabilityProxyKey,
      votingPeriod,
      votingQuorum,
      { from: protocolOwnerAddress }
    )
  })

  it('Initial state - Ensure no SlashProposals exist yet', async () => {
    await _lib.assertRevert(governanceC.getSlashProposalById(0), 'Must provide valid non-zero _proposalId')
    await _lib.assertRevert(governanceC.getSlashProposalById(1), 'Must provide valid non-zero _proposalId')
  })

  it('Submit slash proposal', async () => {
    const proposalId = 1
    const proposer = accounts[1]
    const target = accounts[2]
    const slashAmount = 1

    const lastBlock = (await _lib.getLatestBlock(web3)).number

    // Call submitSlashProposal
    const txReceipt = await governanceC.submitSlashProposal(target, slashAmount, proposalDescription, { from: proposer })

    // Confirm event log
    const txParsed = _lib.parseTx(txReceipt)
    assert.equal(txParsed.event.name, 'SlashProposalSubmitted', 'Expected same event name')
    assert.equal(parseInt(txParsed.event.args.proposalId), proposalId, 'Expected same event.args.proposalId')
    assert.equal(txParsed.event.args.proposer, proposer, 'Expected same event.args.proposer')
    assert.isTrue(parseInt(txParsed.event.args.startBlockNumber) > lastBlock, 'Expected event.args.startBlockNumber > lastBlock')
    assert.equal(txParsed.event.args.target, target, 'Expected same event.args.target')
    assert.equal(parseInt(txParsed.event.args.slashAmount), slashAmount, 'Expected same event.args.slashAmount')
    assert.equal(txParsed.event.args.description, proposalDescription, "Expected same event.args.description")

    // Call getSlashProposalById() and confirm same values
    const proposal = await governanceC.getSlashProposalById.call(proposalId)
    assert.equal(parseInt(proposal.proposalId), proposalId, 'Expected same proposalId')
    assert.equal(proposal.proposer, proposer, 'Expected same proposer')
    assert.isTrue(parseInt(proposal.startBlockNumber) > lastBlock, 'Expected startBlockNumber > lastBlock')
    assert.equal(proposal.target, target, 'Expected same target')
    assert.equal(parseInt(proposal.slashAmount), slashAmount, 'Expected same slashAmount')
    assert.equal(proposal.outcome, Outcome.InProgress, 'Expected same outcome')
    assert.equal(parseInt(proposal.voteMagnitudeYes), 0, 'Expected same voteMagnitudeYes')
    assert.equal(parseInt(proposal.voteMagnitudeNo), 0, 'Expected same voteMagnitudeNo')
    assert.equal(parseInt(proposal.numVotes), 0, 'Expected same numVotes')

    // Confirm all vote states - all Vote.None
    for (const account of accounts) {
      const vote = await governanceC.getVoteBySlashProposalAndVoter.call(proposalId, account)
      assert.equal(vote, Vote.None)
    }
  })

  it('Vote on slash proposal', async () => {
    const proposalId = 1
    const proposer = accounts[1]
    const target = accounts[2]
    const voter = accounts[1]
    const vote = Vote.No
    const defaultVote = Vote.None
    const slashAmount = 1

    const lastBlock = (await _lib.getLatestBlock(web3)).number
    
    await governanceC.submitSlashProposal(target, slashAmount, proposalDescription, { from: proposer })

    // Call submitSlashProposalVote()
    const txReceipt = await governanceC.submitSlashProposalVote(proposalId, vote, { from: voter })

    // Confirm event log
    const txParsed = _lib.parseTx(txReceipt)
    assert.equal(txParsed.event.name, 'SlashProposalVoteSubmitted', 'Expected same event name')
    assert.equal(parseInt(txParsed.event.args.proposalId), proposalId, 'Expected same event.args.proposalId')
    assert.equal(txParsed.event.args.voter, voter, 'Expected same event.args.voter')
    assert.equal(parseInt(txParsed.event.args.vote), vote, 'Expected same event.args.vote')
    assert.equal((parseInt(txParsed.event.args.voterStake)), fromBn(defaultStake), 'Expected same event.args.voterStake')
    assert.equal(parseInt(txParsed.event.args.previousVote), defaultVote, 'Expected same event.args.previousVote')

    // Call getSlashProposalById() and confirm same values
    const proposal = await governanceC.getSlashProposalById.call(proposalId)
    assert.equal(parseInt(proposal.proposalId), proposalId, 'Expected same proposalId')
    assert.equal(proposal.proposer, proposer, 'Expected same proposer')
    assert.isTrue(parseInt(proposal.startBlockNumber) > lastBlock, 'Expected startBlockNumber > lastBlock')
    assert.equal(proposal.target, target, 'Expected same target')
    assert.equal(parseInt(proposal.slashAmount), slashAmount, 'Expected same slashAmount')
    assert.equal(proposal.outcome, Outcome.InProgress, 'Expected same outcome')
    assert.equal(parseInt(proposal.voteMagnitudeYes), 0, 'Expected same voteMagnitudeYes')
    assert.equal(parseInt(proposal.voteMagnitudeNo), defaultStake, 'Expected same voteMagnitudeNo')
    assert.equal(parseInt(proposal.numVotes), 1, 'Expected same numVotes')

    // Confirm all vote states - Vote.No for Voter, Vote.None for all others
    for (const account of accounts) {
      const vote = await governanceC.getVoteBySlashProposalAndVoter.call(proposalId, account)
      if (account == voter) {
        assert.equal(vote, vote)
      } else {
        assert.equal(vote, defaultVote)
      }
    }
  })

  it('Evaluate slash proposal', async () => {
    const proposalId = 1
    const proposer = accounts[1]
    const target = accounts[2]
    const voter = accounts[1]
    const vote = Vote.No
    const defaultVote = Vote.None
    const outcome = Outcome.No
    const slashAmount = 1

    const lastBlock = (await _lib.getLatestBlock(web3)).number
    
    const a = await governanceC.submitSlashProposal(target, slashAmount, proposalDescription, { from: proposer })
    await governanceC.submitSlashProposalVote(proposalId, vote, { from: voter })

    // Advance blocks to the next valid claim
    const proposalStartBlockNumber = parseInt(_lib.parseTx(a).event.args.startBlockNumber)
    let currentBlockNumber = (await _lib.getLatestBlock(web3)).number
    while (currentBlockNumber <= proposalStartBlockNumber + votingPeriod) {
      await _lib.advanceBlock(web3)
      currentBlockNumber = (await _lib.getLatestBlock(web3)).number
    }

    // Call evaluateSlashProposalOutcome()
    const txReceipt = await governanceC.evaluateSlashProposalOutcome(proposalId, { from: proposer })

    // Confirm event log
    const txParsed = _lib.parseTx(txReceipt)
    assert.equal(txParsed.event.name, 'SlashProposalOutcomeEvaluated', 'Expected same event name')
    assert.equal(parseInt(txParsed.event.args.proposalId), proposalId, 'Expected same event.args.proposalId')
    assert.equal(parseInt(txParsed.event.args.outcome), outcome, 'Expected same event.args.outcome')
    assert.equal(parseInt(txParsed.event.args.voteMagnitudeYes), 0, 'Expected same event.args.voteMagnitudeYes')
    assert.equal(parseInt(txParsed.event.args.voteMagnitudeNo), fromBn(defaultStake), 'Expected same event.args.voteMagnitudeNo')
    assert.equal(parseInt(txParsed.event.args.numVotes), 1, 'Expected same event.args.numVotes')

    // Call getSlashProposalById() and confirm same values
    const proposal = await governanceC.getSlashProposalById.call(proposalId)
    assert.equal(parseInt(proposal.proposalId), proposalId, 'Expected same proposalId')
    assert.equal(proposal.proposer, proposer, 'Expected same proposer')
    assert.isTrue(parseInt(proposal.startBlockNumber) > lastBlock, 'Expected startBlockNumber > lastBlock')
    assert.equal(proposal.target, target, 'Expected same target')
    assert.equal(parseInt(proposal.slashAmount), slashAmount, 'Expected same slashAmount')
    assert.equal(proposal.outcome, outcome, 'Expected same outcome')
    assert.equal(parseInt(proposal.voteMagnitudeYes), 0, 'Expected same voteMagnitudeYes')
    assert.equal(parseInt(proposal.voteMagnitudeNo), defaultStake, 'Expected same voteMagnitudeNo')
    assert.equal(parseInt(proposal.numVotes), 1, 'Expected same numVotes')

    // Confirm all vote states - Vote.No for Voter, Vote.None for all others
    for (const account of accounts) {
      const vote = await governanceC.getVoteBySlashProposalAndVoter.call(proposalId, account)
      if (account == voter) {
        assert.equal(vote, vote)
      } else {
        assert.equal(vote, defaultVote)
      }
    }
  })
})