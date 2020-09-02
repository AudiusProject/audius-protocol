const helpers = require('./helpers')
const assert = require('assert')
const { convertAudsToWeiBN } = require('../initScripts/helpers/utils')
const nock = require('nock')
const GovernanceClient = require('../src/services/ethContracts/governanceClient')
const time = require('@openzeppelin/test-helpers/src/time')
const { before } = require('lodash')
const { initializeLibConfig } = require('./helpers')
const AudiusLibs = require('../src')

const { audiusInstance: audius0, getRandomLocalhost } = helpers

let audius1
let audius2
let accounts = null
let web3 = null
const DEFAULT_STAKE = 210000
const PROPOSAL_DESCRIPTION = 'TestDescription'

const setupAccounts = async () => {
  // create additional libs instances
  await audius0.init()
  web3 = audius0.ethWeb3Manager.getWeb3()
  accounts = await web3.eth.getAccounts()
  const sp1 = accounts[1]
  const sp2 = accounts[2]
  const libsConf1 = await initializeLibConfig(sp1)
  const libsConf2 = await initializeLibConfig(sp2)
  audius1 = new AudiusLibs(libsConf1)
  audius2 = new AudiusLibs(libsConf2)

  // Init them all
  await Promise.all([audius1.init(), audius2.init()])

  // Register endpoints & stake
  const inittedLibs = [audius0, audius1, audius2]
  const testServiceType = 'discovery-provider'
  const defaultStake = convertAudsToWeiBN(audius0.ethWeb3Manager.getWeb3(), DEFAULT_STAKE)
  for (const lib of inittedLibs) {
    const testEndpoint = getRandomLocalhost()
    nock(testEndpoint).get('/health_check').reply(200, {
      data:  {
        service: testServiceType,
        version : '0.0.1'
      }
    })

    await lib.ethContracts.ServiceProviderFactoryClient.register(
      testServiceType,
      testEndpoint,
      defaultStake
    )
  }
}

const createProposal = () => {
  const targetContractRegistryKey = web3.utils.utf8ToHex('DelegateManager')

  const callValue = web3.utils.toWei("0", 'ether')
  const functionSignature = 'slash(uint256,address)'
  const slashAmount = web3.utils.toWei("500", 'ether')
  const targetAddress = accounts[1]
  const callData = audius0.ethContracts.GovernanceClient.abiEncode(web3, ['uint256', 'address'], [slashAmount, targetAddress])
  const description = PROPOSAL_DESCRIPTION

  return  {
    targetContractRegistryKey,
    callValue,
    functionSignature,
    callData,
    description,
  }
}
const submitProposal = async () => {
  const proposal = createProposal()
  return audius0.ethContracts.GovernanceClient.submitProposal(proposal)
}

const evaluateProposal = async (id, shouldVote = true) => {
  // Vote
  if (shouldVote) {
    const voteYes = GovernanceClient.Vote.yes
    await audius0.ethContracts.GovernanceClient.submitVote({proposalId: id, vote: voteYes})
  }

  // Advance blocks
  const currentBlock = (await web3.eth.getBlock("latest")).number
  const desired = currentBlock + 20
  await time.advanceBlockTo(desired)

  // Evaluate
  await audius0.ethContracts.GovernanceClient.evaluateProposalOutcome({ proposalId: id })
}

describe('Governance tests', function() {
  this.timeout(5000)

  beforeEach(async function () {
    await setupAccounts()
    await audius0.ethContracts.GovernanceClient.setVotingPeriod(10)
    await audius0.ethContracts.GovernanceClient.setExecutionDelay(10)
  })

  afterEach(async function() {
    // Cleanup outstanding proposals
    const ids = await audius0.ethContracts.GovernanceClient.getInProgressProposals()
    for (let id of ids) {
      await evaluateProposal(id, false)
    }
  })

  it('Submits a proposal successfully', async function() {
    const id = await submitProposal()
    assert.ok(id >= 0)
  })

  it('Gets submitted proposal by ID', async function() {
    // Submit the proposal
    const id = await submitProposal()
    const proposal = await audius0.ethContracts.GovernanceClient.getProposalById({id})

    // Sanity check proposal
    assert.equal(proposal.proposalId, id)
  })

  it('Votes on proposals', async function() {
    const id = await submitProposal()

    // Submit a yes vote initially
    const voteYes = GovernanceClient.Vote.yes
    await audius0.ethContracts.GovernanceClient.submitVote({proposalId: id, vote: voteYes})
    const proposal = await audius0.ethContracts.GovernanceClient.getProposalById({id})
    assert.equal(parseInt(proposal.voteMagnitudeNo), 0)
    assert.ok(parseInt(proposal.voteMagnitudeYes) > 0)

    // Update the vote to be 'no'
    const voteNo = GovernanceClient.Vote.no
    await audius0.ethContracts.GovernanceClient.updateVote({proposalId: id, vote: voteNo})
    const proposal2 = await audius0.ethContracts.GovernanceClient.getProposalById({id})
    assert.equal(parseInt(proposal2.voteMagnitudeYes), 0)
    assert.ok(parseInt(proposal2.voteMagnitudeNo) > 0)
  })

  it('Queries for votes', async function() {
    const id = await submitProposal()
    const proposal = await audius0.ethContracts.GovernanceClient.getProposalById({id})
    const queryStartBlock = proposal.submissionBlockNumber
    // Test for vote creation
    const voteYes = GovernanceClient.Vote.yes
    await audius0.ethContracts.GovernanceClient.submitVote({proposalId: id, vote: voteYes})
    const votes = await audius0.ethContracts.GovernanceClient.getVotes({ proposalId: id, queryStartBlock })
    assert.equal(votes.length, 1)
    assert.equal(votes[0].vote, '2')

    // Test for vote update
    const voteNo = GovernanceClient.Vote.no
    await audius0.ethContracts.GovernanceClient.updateVote({proposalId: id, vote: voteNo})
    const updateVotes = await audius0.ethContracts.GovernanceClient.getVoteUpdates({ proposalId: id, queryStartBlock })
    assert.equal(updateVotes.length, 1)
    assert.equal(updateVotes[0].vote, '1')
  })

  it('Gets proposal description', async function() {
    const id = await submitProposal()
    const description = await audius0.ethContracts.GovernanceClient.getProposalDescriptionById({id})
    assert.equal(description, PROPOSAL_DESCRIPTION)
  })

  it('Gets in progress proposals', async function() {
    const id = await submitProposal()
    const inProgressIds = await audius0.ethContracts.GovernanceClient.getInProgressProposals()
    assert.equal(inProgressIds.length, 1)
    assert.equal(inProgressIds[0], id)

    // evaluate
    await evaluateProposal(id)
    const inProgressIds2 = await audius0.ethContracts.GovernanceClient.getInProgressProposals()
    assert.equal(inProgressIds2.length, 0)
  })

  it.only('Gets votes by address', async function() {
    const id = await submitProposal()
    const proposal = await audius0.ethContracts.GovernanceClient.getProposalById({id})
    const queryStartBlock = proposal.submissionBlockNumber

    // submit votes
    const voteYes = GovernanceClient.Vote.yes
    const voteNo = GovernanceClient.Vote.no
    await audius1.ethContracts.GovernanceClient.submitVote({proposalId: id, vote: voteYes})
    await audius2.ethContracts.GovernanceClient.submitVote({proposalId: id, vote: voteNo})

    // update some votes
    await audius1.ethContracts.GovernanceClient.updateVote({proposalId: id, vote: voteNo})
    await audius2.ethContracts.GovernanceClient.updateVote({proposalId: id, vote: voteYes})

    // get submissions and updates
    const account1Submissions = await audius0.ethContracts.GovernanceClient.getVoteSubmissionsByAddress({ addresses: [accounts[1]], queryStartBlock })
    const account2Updates = await audius0.ethContracts.GovernanceClient.getVoteUpdatesByAddress({ addresses: [accounts[2]], queryStartBlock })

    // assert filters work correctly
    assert.equal(account1Submissions.length, 1)
    assert.equal(account1Submissions[0].voter, accounts[1])
    assert.equal(account2Updates.length, 1)
    assert.equal(account2Updates[0].voter, accounts[2])
  })
})
