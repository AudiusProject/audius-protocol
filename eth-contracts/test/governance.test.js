const ethers = require('ethers')
const BigNum = require('bignumber.js')
const util = require('util')

import * as _lib from './_lib/lib.js'
const encodeCall = require('./encodeCall')

const Registry = artifacts.require('Registry')
const AudiusToken = artifacts.require('AudiusToken')
const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy')
const Staking = artifacts.require('Staking')
const Governance = artifacts.require('Governance')
const ServiceProviderFactory = artifacts.require('ServiceProviderFactory')
const ServiceProviderStorage = artifacts.require('ServiceProviderStorage')
const DelegateManager = artifacts.require('DelegateManager')
const ClaimFactory = artifacts.require('ClaimFactory')

const ownedUpgradeabilityProxyKey = web3.utils.utf8ToHex('OwnedUpgradeabilityProxy')
const serviceProviderStorageKey = web3.utils.utf8ToHex('ServiceProviderStorage')
const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')
const claimFactoryKey = web3.utils.utf8ToHex('ClaimFactory')

const fromBn = n => parseInt(n.valueOf(), 10)

const audToWei = (aud) => {
  return web3.utils.toBN(
    web3.utils.toWei(
      aud.toString(), 'ether'
    )
  )
}

const  bigNumberify = (num) => {
  return ethers.utils.bigNumberify(new BigNum(num).toFixed());
}

const abiEncode = (types, values) => {
  const abi = new ethers.utils.AbiCoder()
  return abi.encode(types, values)
}

const abiDecode = (types, data) => {
  const abi = new ethers.utils.AbiCoder()
  return abi.decode(types, data)
}

const keccak256 = (values) => {
  return ethers.utils.keccak256(values);
}

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

contract('Governance.sol', async (accounts) => {
  let proxyContract
  let tokenContract
  let stakingContract
  let registryContract
  let serviceProviderStorageContract
  let serviceProviderFactoryContract
  let claimFactoryContract
  let delegateManagerContract
  let governanceContract

  const votingPeriod = 10
  const votingQuorum = 1
  const treasuryAddress = accounts[0]
  const protocolOwnerAddress = treasuryAddress
  const testDiscProvType = web3.utils.utf8ToHex('discovery-provider')
  const testEndpoint1 = 'https://localhost:5000'
  const testEndpoint2 = 'https://localhost:5001'

  const registerServiceProvider = async (type, endpoint, amount, account) => {
    // Approve staking transfer
    await tokenContract.approve(stakingContract.address, amount, { from: account })

    const tx = await serviceProviderFactoryContract.register(
      type,
      endpoint,
      amount,
      account,
      { from: account }
    )

    const args = tx.logs.find(log => log.event === 'RegisteredServiceProvider').args
    args.stakedAmountInt = fromBn(args._stakeAmount)
    args.spID = fromBn(args._spID)
    return args
  }

  /**
   * Deploy Registry, OwnedUpgradeabilityProxy, AudiusToken, Staking, and Governance contracts.
   */
  beforeEach(async () => {
    registryContract = await Registry.new()
    proxyContract = await OwnedUpgradeabilityProxy.new({ from: protocolOwnerAddress })
    await registryContract.addContract(ownedUpgradeabilityProxyKey, proxyContract.address)

    tokenContract = await AudiusToken.new({ from: treasuryAddress })

    const stakingContract0 = await Staking.new()
    // Create initialization data
    const initializeData = encodeCall(
      'initialize',
      ['address', 'address'],
      [tokenContract.address, treasuryAddress]
    )

    // Initialize staking contract
    await proxyContract.upgradeToAndCall(
      stakingContract0.address,
      initializeData,
      { from: protocolOwnerAddress }
    )

    stakingContract = await Staking.at(proxyContract.address)

    // Deploy + Registery ServiceProviderStorage contract
    serviceProviderStorageContract = await ServiceProviderStorage.new(registryContract.address)
    await registryContract.addContract(serviceProviderStorageKey, serviceProviderStorageContract.address)

    // Deploy + Register ServiceProviderFactory contract
    serviceProviderFactoryContract = await ServiceProviderFactory.new(
      registryContract.address,
      ownedUpgradeabilityProxyKey,
      serviceProviderStorageKey
    )
    await registryContract.addContract(serviceProviderFactoryKey, serviceProviderFactoryContract.address)

    // Permission sp factory as caller, from the treasuryAddress, which is proxy owner
    await stakingContract.setStakingOwnerAddress(serviceProviderFactoryContract.address, { from: treasuryAddress })

    // Deploy + Register ClaimFactory contract
    claimFactoryContract = await ClaimFactory.new(
      tokenContract.address,
      registryContract.address,
      ownedUpgradeabilityProxyKey,
      { from: treasuryAddress }
    )
    await registryContract.addContract(claimFactoryKey, claimFactoryContract.address)

    // Register new contract as a minter, from the same address that deployed the contract
    await tokenContract.addMinter(claimFactoryContract.address, { from: treasuryAddress })

    // Deploy DelegateManager contract
    delegateManagerContract = await DelegateManager.new(
      tokenContract.address,
      registryContract.address,
      ownedUpgradeabilityProxyKey,
      serviceProviderFactoryKey,
      claimFactoryKey
    )

    // Deploy Governance contract
    governanceContract = await Governance.new(
      registryContract.address,
      ownedUpgradeabilityProxyKey,
      votingPeriod,
      votingQuorum,
      { from: protocolOwnerAddress }
    )
  })

  describe('Slash proposal', async () => {
    const defaultStakeAmount = audToWei(1000)
    const proposalDescription = "TestDescription"
    const stakerAccount1 = accounts[1]
    const stakerAccount2 = accounts[2]
    const delegatorAccount1 = accounts[3]
    
    beforeEach(async () => {
      // Transfer 1000 tokens to stakerAccount1, stakerAccount2, and delegatorAccount1
      await tokenContract.transfer(stakerAccount1, defaultStakeAmount, { from: treasuryAddress })
      await tokenContract.transfer(stakerAccount2, defaultStakeAmount, { from: treasuryAddress })
      await tokenContract.transfer(delegatorAccount1, defaultStakeAmount, { from: treasuryAddress })

      // Record initial staker account token balance
      const initialBalance = await tokenContract.balanceOf(stakerAccount1)

      // Register two SPs with stake
      const tx1 = await registerServiceProvider(
        testDiscProvType,
        testEndpoint1,
        defaultStakeAmount,
        stakerAccount1
      )
      const tx2 = await registerServiceProvider(
        testDiscProvType,
        testEndpoint2,
        defaultStakeAmount,
        stakerAccount2
      )

      // Confirm event has correct amount
      assert.equal(tx1.stakedAmountInt, defaultStakeAmount)

      // Confirm new token balances
      const finalBalance = await tokenContract.balanceOf(stakerAccount1)
      assert.isTrue(
        initialBalance.eq(finalBalance.add(defaultStakeAmount)),
        "Expected balances to be equal"
      )
    })

    it('Initial state - Ensure no Proposals exist yet', async () => {
      await _lib.assertRevert(governanceContract.getProposalById(0), 'Must provide valid non-zero _proposalId')
      await _lib.assertRevert(governanceContract.getProposalById(1), 'Must provide valid non-zero _proposalId')
    })

    it('Submit Proposal for Slash', async () => {
      const proposalId = 1
      const proposerAddress = accounts[1]
      const slashAmount = 1
      const targetAddress = accounts[2]
      const lastBlock = (await _lib.getLatestBlock(web3)).number
      const targetContract = delegateManagerContract.address
      const callValue = bigNumberify(0)
      const signature = 'slash(uint256,address)'
      const callData = abiEncode(['uint256', 'address'], [slashAmount, targetAddress])

      // Call submitProposal
      const txReceipt = await governanceContract.submitProposal(
        targetContract,
        callValue,
        signature,
        callData,
        proposalDescription,
        { from: proposerAddress }
      )

      // Confirm event log
      const txParsed = _lib.parseTx(txReceipt)
      assert.equal(txParsed.event.name, 'ProposalSubmitted', 'Expected same event name')
      assert.equal(parseInt(txParsed.event.args.proposalId), proposalId, 'Expected same event.args.proposalId')
      assert.equal(txParsed.event.args.proposer, proposerAddress, 'Expected same event.args.proposer')
      assert.isTrue(parseInt(txParsed.event.args.startBlockNumber) > lastBlock, 'Expected event.args.startBlockNumber > lastBlock')
      assert.equal(txParsed.event.args.targetContract, targetContract, 'Expected same event.args.targetContract')
      assert.equal(fromBn(txParsed.event.args.callValue), callValue, 'Expected same event.args.callValue')
      assert.equal(txParsed.event.args.signature, signature, 'Expected same event.args.signature')
      assert.equal(txParsed.event.args.callData, callData, 'Expected same event.args.callData')
      assert.equal(txParsed.event.args.description, proposalDescription, "Expected same event.args.description")

      // Call getProposalById() and confirm same values
      const proposal = await governanceContract.getProposalById.call(proposalId)
      assert.equal(parseInt(proposal.proposalId), proposalId, 'Expected same proposalId')
      assert.equal(proposal.proposer, proposerAddress, 'Expected same proposer')
      assert.isTrue(parseInt(proposal.startBlockNumber) > lastBlock, 'Expected startBlockNumber > lastBlock')
      assert.equal(proposal.targetContract, targetContract, 'Expected same proposal.targetContract')
      assert.equal(fromBn(proposal.callValue), callValue, 'Expected same proposal.callValue')
      assert.equal(proposal.signature, signature, 'Expected same proposal.signature')
      assert.equal(proposal.callData, callData, 'Expected same proposal.callData')
      assert.equal(proposal.outcome, Outcome.InProgress, 'Expected same outcome')
      assert.equal(parseInt(proposal.voteMagnitudeYes), 0, 'Expected same voteMagnitudeYes')
      assert.equal(parseInt(proposal.voteMagnitudeNo), 0, 'Expected same voteMagnitudeNo')
      assert.equal(parseInt(proposal.numVotes), 0, 'Expected same numVotes')

      // Confirm all vote states - all Vote.None
      for (const account of accounts) {
        const vote = await governanceContract.getVoteByProposalAndVoter.call(proposalId, account)
        assert.equal(vote, Vote.None)
      }
    })

    it('Vote on Proposal for Slash', async () => {
      const proposalId = 1
      const proposerAddress = accounts[1]
      const slashAmount = 1
      const targetAddress = accounts[2]
      const voterAddress = accounts[1]
      const vote = Vote.No
      const defaultVote = Vote.None
      const lastBlock = (await _lib.getLatestBlock(web3)).number
      const targetContract = delegateManagerContract.address
      const callValue = bigNumberify(0)
      const signature = 'slash(uint256,address)'
      const callData = abiEncode(['uint256', 'address'], [slashAmount, targetAddress])

      // Call submitProposal
      await governanceContract.submitProposal(
        targetContract,
        callValue,
        signature,
        callData,
        proposalDescription,
        { from: proposerAddress }
      )

      // Call submitProposalVote()
      const txReceipt = await governanceContract.submitProposalVote(proposalId, vote, { from: voterAddress })

      // Confirm event log
      const txParsed = _lib.parseTx(txReceipt)
      assert.equal(txParsed.event.name, 'ProposalVoteSubmitted', 'Expected same event name')
      assert.equal(parseInt(txParsed.event.args.proposalId), proposalId, 'Expected same event.args.proposalId')
      assert.equal(txParsed.event.args.voter, voterAddress, 'Expected same event.args.voter')
      assert.equal(parseInt(txParsed.event.args.vote), vote, 'Expected same event.args.vote')
      assert.equal((parseInt(txParsed.event.args.voterStake)), fromBn(defaultStakeAmount), 'Expected same event.args.voterStake')
      assert.equal(parseInt(txParsed.event.args.previousVote), defaultVote, 'Expected same event.args.previousVote')

      // Call getProposalById() and confirm same values
      const proposal = await governanceContract.getProposalById.call(proposalId)
      assert.equal(parseInt(proposal.proposalId), proposalId, 'Expected same proposalId')
      assert.equal(proposal.proposer, proposerAddress, 'Expected same proposer')
      assert.isTrue(parseInt(proposal.startBlockNumber) > lastBlock, 'Expected startBlockNumber > lastBlock')
      assert.equal(proposal.targetContract, targetContract, 'Expected same proposal.targetContract')
      assert.equal(fromBn(proposal.callValue), callValue, 'Expected same proposal.callValue')
      assert.equal(proposal.signature, signature, 'Expected same proposal.signature')
      assert.equal(proposal.callData, callData, 'Expected same proposal.callData')
      assert.equal(proposal.outcome, Outcome.InProgress, 'Expected same outcome')
      assert.equal(parseInt(proposal.voteMagnitudeYes), 0, 'Expected same voteMagnitudeYes')
      assert.equal(parseInt(proposal.voteMagnitudeNo), defaultStakeAmount, 'Expected same voteMagnitudeNo')
      assert.equal(parseInt(proposal.numVotes), 1, 'Expected same numVotes')

      // Confirm all vote states - Vote.No for Voter, Vote.None for all others
      for (const account of accounts) {
        const voterVote = await governanceContract.getVoteByProposalAndVoter.call(proposalId, account)
        if (account == voterAddress) {
          assert.equal(voterVote, vote)
        } else {
          assert.equal(voterVote, defaultVote)
        }
      }
    })

    it('Evaluate successful Proposal + execute Slash', async () => {
      const proposalId = 1
      const proposerAddress = stakerAccount1
      const slashAmount = 1
      const targetAddress = stakerAccount2
      const voterAddress = stakerAccount1
      const vote = Vote.Yes
      const defaultVote = Vote.None
      const lastBlock = (await _lib.getLatestBlock(web3)).number
      const targetContract = delegateManagerContract.address
      const callValue = bigNumberify(0)
      const signature = 'slash(uint256,address)'
      const callData = abiEncode(['uint256', 'address'], [slashAmount, targetAddress])
      const outcome = Outcome.Yes 
      const txHash = keccak256(
        abiEncode(
          ['address', 'uint256', 'string', 'bytes'],
          [targetContract, callValue, signature, callData]
        )
      )
      const returnData = null

      // Confirm initial Stake state
      const initialTotalStake = parseInt(await stakingContract.totalStaked())
      assert.equal(initialTotalStake, defaultStakeAmount * 2)
      const initialStakeAcct2 = parseInt(await stakingContract.totalStakedFor(targetAddress))
      assert.equal(initialStakeAcct2, defaultStakeAmount)

      // Call submitProposal + submitProposalVote
      const submitProposalTxReceipt = await governanceContract.submitProposal(
        targetContract,
        callValue,
        signature,
        callData,
        proposalDescription,
        { from: proposerAddress }
      )
      await governanceContract.submitProposalVote(proposalId, vote, { from: voterAddress })

      // Advance blocks to the next valid claim
      const proposalStartBlockNumber = parseInt(_lib.parseTx(submitProposalTxReceipt).event.args.startBlockNumber)
      let currentBlockNumber = (await _lib.getLatestBlock(web3)).number
      while (currentBlockNumber <= proposalStartBlockNumber + votingPeriod) {
        await _lib.advanceBlock(web3)
        currentBlockNumber = (await _lib.getLatestBlock(web3)).number
      }

      // Call evaluateProposalOutcome()
      const txReceipt = await governanceContract.evaluateProposalOutcome(proposalId, { from: proposerAddress })

      // Confirm event logs (2 events)
      const [txParsedEvent0, txParsedEvent1] = _lib.parseTx(txReceipt, true)
      assert.equal(txParsedEvent0.event.name, 'TransactionExecuted', 'Expected same event name')
      assert.equal(txParsedEvent0.event.args.txHash, txHash, 'Expected same txParsedEvent0.event.args.txHash')
      assert.equal(txParsedEvent0.event.args.targetContract, targetContract, 'Expected same txParsedEvent0.event.args.targetContract')
      assert.equal(fromBn(txParsedEvent0.event.args.callValue), callValue, 'Expected same txParsedEvent0.event.args.callValue')
      assert.equal(txParsedEvent0.event.args.signature, signature, 'Expected same txParsedEvent0.event.args.signature')
      assert.equal(txParsedEvent0.event.args.callData, callData, 'Expected same txParsedEvent0.event.args.callData')
      assert.equal(txParsedEvent0.event.args.returnData, returnData, 'Expected same txParsedEvent0.event.args.returnData')
      assert.equal(txParsedEvent1.event.name, 'ProposalOutcomeEvaluated', 'Expected same event name')
      assert.equal(parseInt(txParsedEvent1.event.args.proposalId), proposalId, 'Expected same event.args.proposalId')
      assert.equal(parseInt(txParsedEvent1.event.args.outcome), outcome, 'Expected same event.args.outcome')
      assert.equal(parseInt(txParsedEvent1.event.args.voteMagnitudeYes), fromBn(defaultStakeAmount), 'Expected same event.args.voteMagnitudeYes')
      assert.equal(parseInt(txParsedEvent1.event.args.voteMagnitudeNo), 0, 'Expected same event.args.voteMagnitudeNo')
      assert.equal(parseInt(txParsedEvent1.event.args.numVotes), 1, 'Expected same event.args.numVotes')

      // Call getProposalById() and confirm same values
      const proposal = await governanceContract.getProposalById.call(proposalId)
      assert.equal(parseInt(proposal.proposalId), proposalId, 'Expected same proposalId')
      assert.equal(proposal.proposer, proposerAddress, 'Expected same proposer')
      assert.isTrue(parseInt(proposal.startBlockNumber) > lastBlock, 'Expected startBlockNumber > lastBlock')
      assert.equal(proposal.targetContract, targetContract, 'Expected same proposal.targetContract')
      assert.equal(fromBn(proposal.callValue), callValue, 'Expected same proposal.callValue')
      assert.equal(proposal.signature, signature, 'Expected same proposal.signature')
      assert.equal(proposal.callData, callData, 'Expected same proposal.callData')
      assert.equal(proposal.outcome, outcome, 'Expected same outcome')
      assert.equal(parseInt(proposal.voteMagnitudeYes), defaultStakeAmount, 'Expected same voteMagnitudeYes')
      assert.equal(parseInt(proposal.voteMagnitudeNo), 0, 'Expected same voteMagnitudeNo')
      assert.equal(parseInt(proposal.numVotes), 1, 'Expected same numVotes')

      // Confirm all vote states - Vote.No for Voter, Vote.None for all others
      for (const account of accounts) {
        const voterVote = await governanceContract.getVoteByProposalAndVoter.call(proposalId, account)
        if (account == voterAddress) {
          assert.equal(voterVote, vote)
        } else {
          assert.equal(voterVote, defaultVote)
        }
      }

      // Confirm Slash action succeeded by checking new Stake values
      const finalStakeAcct2 = parseInt(await stakingContract.totalStakedFor(targetAddress))
      assert.equal(finalStakeAcct2, defaultStakeAmount - slashAmount)
      assert.equal(
        initialTotalStake,
        await stakingContract.totalStaked(),
        'Expected same total stake amount'
      )
    })
  })

  describe.skip('Upgrade contract', async () => {
    // example upgradeProxy.test.js:63
  })
})