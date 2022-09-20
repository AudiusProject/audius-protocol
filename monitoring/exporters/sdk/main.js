const express = require('express')
const promClient = require('prom-client')
const { libs } = require('@audius/sdk')

const ETH_TOKEN_ADDRESS = '0x18aAA7115705e8be94bfFEBDE57Af9BFc265B998'
const ETH_REGISTRY_ADDRESS = '0xd976d3b4f4e22a238c1A736b6612D22f17b6f64C'
const ETH_PROVIDER_ENDPOINT = 'https://eth.audius.co'
const ETH_OWNER_WALLET = '0xC7310a03e930DD659E15305ed7e1F5Df0F0426C5'
const audiusLibs = new libs({
  ethWeb3Config: libs.configEthWeb3(
    ETH_TOKEN_ADDRESS,
    ETH_REGISTRY_ADDRESS,
    ETH_PROVIDER_ENDPOINT,
    ETH_OWNER_WALLET
  ),
  isServer: true,
  enableUserReplicaSetManagerContract: true
})

// Setup Prometheus metrics
const prefix = 'audius_exporters_sdk_'
const metricNames = {
  PROPOSALS: 'proposals',
  PROPOSALS_BY_UNKNOWN_PROPOSERS: 'proposals_by_unknown_proposers',
  API_FAILURE: 'api_failure',
}
const METRICS = Object.freeze({
  [metricNames.PROPOSALS]: new promClient.Gauge({
    name: `${prefix}${metricNames.PROPOSALS}`,
    help: 'Number for all Proposal (by outcome)',
    labelNames: ['outcome'],
  }),
  [metricNames.PROPOSALS_BY_UNKNOWN_PROPOSERS]: new promClient.Gauge({
    name: `${prefix}${metricNames.PROPOSALS_BY_UNKNOWN_PROPOSERS}`,
    help: 'The number of proposals opened by an unknown proposer',
  }),
  [metricNames.API_FAILURE]: new promClient.Gauge({
    name: `${prefix}${metricNames.API_FAILURE}`,
    help: 'Count when alchemy calls fail.',
  }),
})
METRICS[metricNames.PROPOSALS].set({ outcome: 'InProgress' }, 0)
METRICS[metricNames.PROPOSALS_BY_UNKNOWN_PROPOSERS].set(0)
METRICS[metricNames.API_FAILURE].set(0)
const enableDefaultMetrics = () => {
  const collectDefaultMetrics = promClient.collectDefaultMetrics
  collectDefaultMetrics({ prefix })
}
enableDefaultMetrics()

// Constants
const KNOWN_PROPOSERS = new Set([
  '0xe5b256d302ea2f4e04B8F3bfD8695aDe147aB68d',
  '0xc1f351FE81dFAcB3541e59177AC71Ed237BD15D0',
  '0xD79819bAf3326FAbB7ba95b098e6515a0f6408B8',
  '0x8C860adb28CA8A33dB5571536BFCF7D6522181e5',
  '0x1BD9D60a0103FF2fA25169918392f118Bc616Dc9',
  '0xA62c3ced6906B188A4d4A3c981B79f2AABf2107F',
  '0xbdbB5945f252bc3466A319CDcC3EE8056bf2e569',
  '0x683A3C882e1DCD0A3012E2D45A47A9e8de8868d7',
])
const OUTCOME = Object.freeze({
  0: 'InProgress',
  1: 'Rejected',
  2: 'ApprovedExecuted',
  3: 'QuorumNotMet',
  4: 'ApprovedExecutionFailed',
  // Evaluating - transient internal state
  5: 'Vetoed',
  6: 'TargetContractAddressChanged',
  7: 'TargetContractCodeHashChanged',
})
let PREVIOUSLY_SEEN_PROPOSAL_ID = 0
const PROPOSAL_OUTCOME_TALLY = {}

const clearTally = () => {
  for (const outcome in PROPOSAL_OUTCOME_TALLY) {
    delete PROPOSAL_OUTCOME_TALLY[outcome];
  }
}

const tallyProposalOutcomes = (outcome) => {
  if (!PROPOSAL_OUTCOME_TALLY[outcome]) {
    PROPOSAL_OUTCOME_TALLY[outcome] = 0
  }
  PROPOSAL_OUTCOME_TALLY[outcome] += 1
}

const scanGovernanceProposals = async () => {
  // Grab all proposals
  const proposals = await audiusLibs.ethContracts.GovernanceClient.getProposals()
  const lastProposal = proposals[proposals.length - 1]

  // If a new proposal is detected (or the exporter is starting) calculate
  // and export new metrics
  if (PREVIOUSLY_SEEN_PROPOSAL_ID !== parseInt(lastProposal.proposalId)) {
    let unknownProposerCount = 0
    clearTally()

    // scan all proposals and...
    for (const proposal of proposals) {
      // tally unknown proposers
      if (!KNOWN_PROPOSERS.has(proposal.proposer)) {
        ++unknownProposerCount
      }

      // grab the full proposal to look for open proposals
      const fullProposal = await audiusLibs.ethContracts.GovernanceClient.getProposalById(proposal.proposalId)
      tallyProposalOutcomes(OUTCOME[fullProposal.outcome])
    }

    // save the number of proposals opened by an unknown proposer
    METRICS[metricNames.PROPOSALS_BY_UNKNOWN_PROPOSERS].set(
      parseFloat(unknownProposerCount)
    )

    // save counts for all Proposal by outcome
    for (const outcome in PROPOSAL_OUTCOME_TALLY) {
      METRICS[metricNames.PROPOSALS].set(
        { outcome },
        parseFloat(PROPOSAL_OUTCOME_TALLY[outcome])
      )
    }

    // set flag to cache tally
    PREVIOUSLY_SEEN_PROPOSAL_ID = parseInt(lastProposal.proposalId)
  }
}
const monitorGovernanceProposals = async () => {
  try {
    await scanGovernanceProposals()
  } catch (error) {
    console.log(error)
    METRICS[metricNames.API_FAILURE].inc()
  }
}

const main = async () => {
  await audiusLibs.init()
  monitorGovernanceProposals()
  setInterval(function () { monitorGovernanceProposals() }, 30 * 1000)

  // Start Prometheus exporter
  const server = express()
  const port = process.env.PORT || 3000
  server.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', promClient.register.contentType)
      res.end(await promClient.register.metrics())
    } catch (ex) {
      res.status(500).end(ex)
    }
  })
  server.listen(port, () => {
    console.log(
      `Server listening to ${port}, metrics exposed on /metrics endpoint`,
    )
  })
}

main()
