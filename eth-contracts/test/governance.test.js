import * as _lib from '../utils/lib.js'
const { time } = require('@openzeppelin/test-helpers')

const Registry = artifacts.require('Registry')
const AudiusToken = artifacts.require('AudiusToken')
const AudiusAdminUpgradeabilityProxy = artifacts.require('AudiusAdminUpgradeabilityProxy')
const Staking = artifacts.require('Staking')
const StakingUpgraded = artifacts.require('StakingUpgraded')
const Governance = artifacts.require('Governance')
const ServiceTypeManager = artifacts.require('ServiceTypeManager')
const ServiceProviderFactory = artifacts.require('ServiceProviderFactory')
const DelegateManager = artifacts.require('DelegateManager')
const ClaimsManager = artifacts.require('ClaimsManager')
const TestContract = artifacts.require('TestContract')

const stakingProxyKey = web3.utils.utf8ToHex('StakingProxy')
const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')
const serviceTypeManagerProxyKey = web3.utils.utf8ToHex('ServiceTypeManagerProxy')
const claimsManagerProxyKey = web3.utils.utf8ToHex('ClaimsManagerProxy')
const governanceKey = web3.utils.utf8ToHex('Governance')
const delegateManagerKey = web3.utils.utf8ToHex('DelegateManagerKey')

const Outcome = Object.freeze({
  InProgress: 0,
  No: 1,
  Yes: 2,
  Invalid: 3,
  TxFailed: 4
})

const Vote = Object.freeze({
  None: 0,
  No: 1,
  Yes: 2
})


contract('Governance.sol', async (accounts) => {
  let token, registry, staking0, staking, stakingProxy, claimsManager0, claimsManagerProxy
  let serviceProviderFactory, claimsManager, delegateManager, governance

  const votingPeriod = 10
  const votingQuorum = 1

  // intentionally not using acct0 to make sure no TX accidentally succeeds without specifying sender
  const [, proxyAdminAddress, proxyDeployerAddress] = accounts
  const guardianAddress = proxyDeployerAddress

  const testDiscProvType = web3.utils.utf8ToHex('discovery-provider')
  const testEndpoint1 = 'https://localhost:5000'
  const testEndpoint2 = 'https://localhost:5001'

  const defaultStakeAmount = _lib.audToWeiBN(1000)
  const proposalDescription = "TestDescription"
  const stakerAccount1 = accounts[10]
  const stakerAccount2 = accounts[11]
  const delegatorAccount1 = accounts[12]

  /**
   * Deploy Registry, AudiusAdminUpgradeabilityProxy, AudiusToken, Staking, and Governance contracts
   */
  beforeEach(async () => {
    token = await _lib.deployToken(artifacts, proxyAdminAddress, proxyDeployerAddress)
    registry = await _lib.deployRegistry(artifacts, proxyAdminAddress, proxyDeployerAddress)

    // Deploy + register Governance contract
    governance = await _lib.deployGovernance(
      artifacts,
      proxyAdminAddress,
      proxyDeployerAddress,
      registry,
      stakingProxyKey,
      governanceKey,
      votingPeriod,
      votingQuorum,
      guardianAddress
    )
    await registry.addContract(governanceKey, governance.address, { from: proxyDeployerAddress })

    // Deploy + register Staking
    let stakingInitializeData = _lib.encodeCall(
      'initialize',
      ['address', 'address'],
      [
        token.address,
        governance.address
      ]
    )
    staking0 = await Staking.new({ from: proxyDeployerAddress })
    stakingProxy = await AudiusAdminUpgradeabilityProxy.new(
      staking0.address,
      proxyAdminAddress,
      stakingInitializeData,
      governance.address,
      { from: proxyDeployerAddress }
    )
    staking = await Staking.at(stakingProxy.address)
    await registry.addContract(stakingProxyKey, stakingProxy.address, { from: proxyDeployerAddress })

    // Set stakingAddress in governance
    await governance.guardianExecuteTransaction(
      governanceKey,
      _lib.toBN(0),
      'setStakingAddress(address)',
      _lib.abiEncode(['address'], [stakingProxy.address]),
      { from: guardianAddress }
    )

    // Deploy + register ServiceTypeManager
    let serviceTypeInitializeData = _lib.encodeCall(
      'initialize',
      ['address'],
      [governance.address]
    )
    let serviceTypeManager0 = await ServiceTypeManager.new({ from: proxyDeployerAddress })
    let serviceTypeManagerProxy = await AudiusAdminUpgradeabilityProxy.new(
      serviceTypeManager0.address,
      proxyAdminAddress,
      serviceTypeInitializeData,
      governance.address,
      { from: proxyAdminAddress }
    )
    await registry.addContract(serviceTypeManagerProxyKey, serviceTypeManagerProxy.address, { from: proxyDeployerAddress })
    let serviceTypeManager = await ServiceTypeManager.at(serviceTypeManagerProxy.address)

    // Register discprov serviceType
    await _lib.addServiceType(
      testDiscProvType,
      _lib.audToWei(5),
      _lib.audToWei(10000000),
      governance,
      guardianAddress,
      serviceTypeManagerProxyKey,
      true
    )

    // Deploy + Register ServiceProviderFactory contract
    let serviceProviderFactory0 = await ServiceProviderFactory.new({ from: proxyDeployerAddress })
    const serviceProviderFactoryCalldata = _lib.encodeCall(
      'initialize',
      ['address', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32'],
      [registry.address, stakingProxyKey, delegateManagerKey, governanceKey, serviceTypeManagerProxyKey, claimsManagerProxyKey]
    )
    let serviceProviderFactoryProxy = await AudiusAdminUpgradeabilityProxy.new(
      serviceProviderFactory0.address,
      proxyAdminAddress,
      serviceProviderFactoryCalldata,
      governance.address,
      { from: proxyAdminAddress }
    )
    serviceProviderFactory = await ServiceProviderFactory.at(serviceProviderFactoryProxy.address)
    await registry.addContract(serviceProviderFactoryKey, serviceProviderFactoryProxy.address, { from: proxyDeployerAddress })

    // Deploy + register claimsManagerProxy
    claimsManager0 = await ClaimsManager.new({ from: proxyDeployerAddress })
    const claimsInitializeCallData = _lib.encodeCall(
      'initialize',
      ['address', 'address', 'bytes32', 'bytes32', 'bytes32', 'bytes32'],
      [token.address, registry.address, stakingProxyKey, serviceProviderFactoryKey, delegateManagerKey, governanceKey]
    )
    claimsManagerProxy = await AudiusAdminUpgradeabilityProxy.new(
      claimsManager0.address,
      proxyAdminAddress,
      claimsInitializeCallData,
      governance.address,
      { from: proxyDeployerAddress }
    )
    claimsManager = await ClaimsManager.at(claimsManagerProxy.address)
    await registry.addContract(
      claimsManagerProxyKey,
      claimsManagerProxy.address,
      { from: proxyDeployerAddress }
    )

    // Register new contract as a minter, from the same address that deployed the contract
    await token.addMinter(claimsManager.address, { from: proxyDeployerAddress })

    // Deploy + register DelegateManager contract
    const delegateManagerInitializeData = _lib.encodeCall(
      'initialize',
      ['address', 'address', 'bytes32', 'bytes32', 'bytes32', 'bytes32'],
      [token.address, registry.address, governanceKey, stakingProxyKey, serviceProviderFactoryKey, claimsManagerProxyKey]
    )
    let delegateManager0 = await DelegateManager.new({ from: proxyDeployerAddress })
    let delegateManagerProxy = await AudiusAdminUpgradeabilityProxy.new(
      delegateManager0.address,
      proxyAdminAddress,
      delegateManagerInitializeData,
      governance.address,
      { from: proxyDeployerAddress }
    )
    delegateManager = await DelegateManager.at(delegateManagerProxy.address)
    await registry.addContract(delegateManagerKey, delegateManagerProxy.address, { from: proxyDeployerAddress })

    // Configure staking address references from governance contract
    await governance.guardianExecuteTransaction(
      stakingProxyKey,
      _lib.toBN(0),
      'setServiceProviderFactoryAddress(address)',
      _lib.abiEncode(['address'], [serviceProviderFactoryProxy.address]),
      { from: guardianAddress })
    await governance.guardianExecuteTransaction(
      stakingProxyKey,
      _lib.toBN(0),
      'setClaimsManagerAddress(address)',
      _lib.abiEncode(['address'], [claimsManagerProxy.address]),
      { from: guardianAddress })
    await governance.guardianExecuteTransaction(
      stakingProxyKey,
      _lib.toBN(0),
      'setDelegateManagerAddress(address)',
      _lib.abiEncode(['address'], [delegateManagerProxy.address]),
      { from: guardianAddress })
  })

  /**
   * Transfer tokens & register 2 SPs
   */
  beforeEach(async () => {
    // Transfer 1000 tokens to stakerAccount1, stakerAccount2, and delegatorAccount1
    await token.transfer(stakerAccount1, defaultStakeAmount, { from: proxyDeployerAddress })
    await token.transfer(stakerAccount2, defaultStakeAmount, { from: proxyDeployerAddress })
    await token.transfer(delegatorAccount1, defaultStakeAmount, { from: proxyDeployerAddress })

    // Record initial staker account token balance
    const initialBalance = await token.balanceOf(stakerAccount1)

    // Register two SPs with stake
    const tx1 = await _lib.registerServiceProvider(
      token,
      staking,
      serviceProviderFactory,
      testDiscProvType,
      testEndpoint1,
      defaultStakeAmount,
      stakerAccount1
    )
    await _lib.registerServiceProvider(
      token,
      staking,
      serviceProviderFactory,
      testDiscProvType,
      testEndpoint2,
      defaultStakeAmount,
      stakerAccount2
    )

    // Confirm event has correct amount
    assert.isTrue(tx1.stakeAmount.eq(defaultStakeAmount))

    // Confirm new token balances
    const finalBalance = await token.balanceOf(stakerAccount1)
    assert.isTrue(
      initialBalance.eq(
        finalBalance.add(defaultStakeAmount)
      ),
      "Expected initialBalance == finalBalance + defaultStakeAmount"
    )
  })

  it('Initialize require statements', async () => {
    // Requires non-zero _registryAddress
    let governance0 = await Governance.new({ from: proxyDeployerAddress })
    let governanceCallData = _lib.encodeCall(
      'initialize',
      ['address', 'uint256', 'uint256', 'address'],
      [0x0, votingPeriod, votingQuorum, proxyDeployerAddress]
    )
    await _lib.assertRevert(
      AudiusAdminUpgradeabilityProxy.new(
        governance0.address,
        proxyAdminAddress,
        governanceCallData,
        _lib.addressZero,
        { from: proxyDeployerAddress }
      ),
      'revert'
    )

    // Requires non-zero _votingPeriod
    governance0 = await Governance.new({ from: proxyDeployerAddress })
    governanceCallData = _lib.encodeCall(
      'initialize',
      ['address', 'uint256', 'uint256', 'address'],
      [registry.address, 0, votingQuorum, proxyDeployerAddress]
    )
    await _lib.assertRevert(
      AudiusAdminUpgradeabilityProxy.new(
        governance0.address,
        proxyAdminAddress,
        governanceCallData,
        governance.address,
        { from: proxyDeployerAddress }
      ),
      "revert"
    )

    // Requires non-zero _votingQuorum
    governance0 = await Governance.new({ from: proxyDeployerAddress })
    governanceCallData = _lib.encodeCall(
      'initialize',
      ['address', 'uint256', 'uint256', 'address'],
      [registry.address, votingPeriod, 0, proxyDeployerAddress]
    )
    await _lib.assertRevert(
      AudiusAdminUpgradeabilityProxy.new(
        governance0.address,
        proxyAdminAddress,
        governanceCallData,
        governance.address,
        { from: proxyDeployerAddress }
      ),
      "revert"
    )
  })

  describe('Slash proposal', async () => {
    it('Initial state - Ensure no Proposals exist yet', async () => {
      await _lib.assertRevert(governance.getProposalById(0), 'Must provide valid non-zero _proposalId')
      await _lib.assertRevert(governance.getProposalById(1), 'Must provide valid non-zero _proposalId')

      // getProposalById with invalid proposalId
      await _lib.assertRevert(
        governance.getProposalById(5),
        "Must provide valid non-zero _proposalId"
      )

      // getVoteByProposalAndVogter with invalid proposalId
      await _lib.assertRevert(
        governance.getVoteByProposalAndVoter(5, accounts[5]),
        "Must provide valid non-zero _proposalId"
      )
    })

    it('Should fail to Submit Proposal for unregistered target contract', async () => {
      const proposerAddress = accounts[10]
      const slashAmount = _lib.toBN(1)
      const targetAddress = accounts[11]
      const targetContractRegistryKey = web3.utils.utf8ToHex('invalidKey')
      const callValue = _lib.toBN(0)
      const signature = 'slash(uint256,address)'
      const callData = _lib.abiEncode(['uint256', 'address'], [slashAmount.toNumber(), targetAddress])

      await _lib.assertRevert(
        governance.submitProposal(
          targetContractRegistryKey,
          callValue,
          signature,
          callData,
          proposalDescription,
          { from: proposerAddress }
        ),
        "_targetContractRegistryKey must point to valid registered contract"
      )
    })

    it('Fail to submitProposal with no signature', async () => {
      const proposerAddress = accounts[10]
      const slashAmount = _lib.toBN(1)
      const targetAddress = accounts[11]
      const targetContractRegistryKey = delegateManagerKey
      const callValue = _lib.toBN(0)
      const callData = _lib.abiEncode(['uint256', 'address'], [_lib.fromBN(slashAmount), targetAddress])
      
      await _lib.assertRevert(
        governance.submitProposal(
          targetContractRegistryKey,
          callValue,
          '',
          callData,
          proposalDescription,
          { from: proposerAddress }
        ),
        "Governance::submitProposal: _signature cannot be empty."
      )
    })

    it('Should fail to submitProposal from non-staker caller', async () => {
      const proposerAddress = accounts[15]
      const slashAmount = _lib.toBN(1)
      const targetAddress = accounts[11]
      const targetContractRegistryKey = web3.utils.utf8ToHex("invalidKey")
      const callValue = _lib.toBN(0)
      const signature = 'slash(uint256,address)'
      const callData = _lib.abiEncode(['uint256', 'address'], [_lib.fromBN(slashAmount), targetAddress])

      await _lib.assertRevert(
        governance.submitProposal(
          targetContractRegistryKey,
          callValue,
          signature,
          callData,
          proposalDescription,
          { from: proposerAddress }
        ),
        "Proposer must be active staker with non-zero stake."
      )
    })

    it('Submit Proposal for Slash', async () => {
      const proposalId = 1
      const proposerAddress = accounts[10]
      const slashAmount = _lib.toBN(1)
      const targetAddress = accounts[11]
      const lastBlock = (await _lib.getLatestBlock(web3)).number
      const targetContractRegistryKey = delegateManagerKey
      const targetContractAddress = delegateManager.address
      const callValue = _lib.toBN(0)
      const signature = 'slash(uint256,address)'
      const callData = _lib.abiEncode(['uint256', 'address'], [slashAmount.toNumber(), targetAddress])

      // Call submitProposal
      const txReceipt = await governance.submitProposal(
        targetContractRegistryKey,
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
      assert.equal(txParsed.event.args.description, proposalDescription, "Expected same event.args.description")

      // Call getProposalById() and confirm same values
      const proposal = await governance.getProposalById.call(proposalId)
      assert.equal(parseInt(proposal.proposalId), proposalId, 'Expected same proposalId')
      assert.equal(proposal.proposer, proposerAddress, 'Expected same proposer')
      assert.isTrue(parseInt(proposal.startBlockNumber) > lastBlock, 'Expected startBlockNumber > lastBlock')
      assert.equal(_lib.toStr(proposal.targetContractRegistryKey), _lib.toStr(targetContractRegistryKey), 'Expected same proposal.targetContractRegistryKey')
      assert.equal(proposal.targetContractAddress, targetContractAddress, 'Expected same proposal.targetContractAddress')
      assert.equal(proposal.callValue.toNumber(), callValue, 'Expected same proposal.callValue')
      assert.equal(proposal.signature, signature, 'Expected same proposal.signature')
      assert.equal(proposal.callData, callData, 'Expected same proposal.callData')
      assert.equal(proposal.outcome, Outcome.InProgress, 'Expected same outcome')
      assert.equal(parseInt(proposal.voteMagnitudeYes), 0, 'Expected same voteMagnitudeYes')
      assert.equal(parseInt(proposal.voteMagnitudeNo), 0, 'Expected same voteMagnitudeNo')
      assert.equal(parseInt(proposal.numVotes), 0, 'Expected same numVotes')

      // Confirm all vote states - all Vote.None
      for (const account of accounts) {
        const vote = await governance.getVoteByProposalAndVoter.call(proposalId, account)
        assert.equal(vote, Vote.None)
      }
    })

    describe('Proposal voting', async () => {
      let proposalId, proposerAddress, slashAmount, targetAddress, voter1Address, voter2Address
      let defaultVote, lastBlock, targetContractRegistryKey, targetContractAddress
      let callValue, signature, callData, submitProposalTxReceipt

      beforeEach(async () => {
        proposalId = 1
        proposerAddress = stakerAccount1
        slashAmount = _lib.toBN(1)
        targetAddress = stakerAccount2
        voter1Address = stakerAccount1
        voter2Address = stakerAccount2
        defaultVote = Vote.None
        lastBlock = (await _lib.getLatestBlock(web3)).number
        targetContractRegistryKey = delegateManagerKey
        targetContractAddress = delegateManager.address
        callValue = _lib.toBN(0)
        signature = 'slash(uint256,address)'
        callData = _lib.abiEncode(['uint256', 'address'], [_lib.fromBN(slashAmount), targetAddress])
  
        // Call submitProposal
        submitProposalTxReceipt = await governance.submitProposal(
          targetContractRegistryKey,
          callValue,
          signature,
          callData,
          proposalDescription,
          { from: proposerAddress }
        )
      })

      it('Fail to vote with invalid proposalId', async () => {
        await _lib.assertRevert(
          governance.submitProposalVote(5, Vote.Yes, { from: stakerAccount1 }),
          "Must provide valid non-zero _proposalId"
        )
      })

      it('Fail to vote with invalid voter', async () => {
        await _lib.assertRevert(
          governance.submitProposalVote(proposalId, Vote.Yes, { from: accounts[15] }),
          "Voter must be active staker with non-zero stake."
        )
      })

      it('Fail to vote after votingPeriod has ended', async () => {
        // Advance blocks to the next valid claim
        const proposalStartBlockNumber = parseInt(_lib.parseTx(submitProposalTxReceipt).event.args.startBlockNumber)
        await time.advanceBlockTo(proposalStartBlockNumber + votingPeriod)

        await _lib.assertRevert(
          governance.submitProposalVote(proposalId, Vote.Yes, { from: stakerAccount1 }),
          "Governance::submitProposalVote: Proposal votingPeriod has ended"
        )
      })

      it('Fail to submit invalid vote', async () => {
        await _lib.assertRevert(
          governance.submitProposalVote(proposalId, Vote.None, { from: stakerAccount1 }),
          "Governance::submitProposalVote: Can only submit a Yes or No vote"
        )
      })

      it('Successfully vote on Proposal for Slash', async () => {
        const vote = Vote.No
        
        // Call submitProposalVote()
        const txReceipt = await governance.submitProposalVote(proposalId, vote, { from: voter1Address })
  
        // Confirm event log
        const txParsed = _lib.parseTx(txReceipt)
        assert.equal(txParsed.event.name, 'ProposalVoteSubmitted', 'Expected same event name')
        assert.equal(parseInt(txParsed.event.args.proposalId), proposalId, 'Expected same event.args.proposalId')
        assert.equal(txParsed.event.args.voter, voter1Address, 'Expected same event.args.voter')
        assert.equal(parseInt(txParsed.event.args.vote), vote, 'Expected same event.args.vote')
        assert.isTrue(txParsed.event.args.voterStake.eq(defaultStakeAmount), 'Expected same event.args.voterStake')
        assert.equal(parseInt(txParsed.event.args.previousVote), defaultVote, 'Expected same event.args.previousVote')
  
        // Call getProposalById() and confirm same values
        const proposal = await governance.getProposalById.call(proposalId)
        assert.equal(parseInt(proposal.proposalId), proposalId, 'Expected same proposalId')
        assert.equal(proposal.proposer, proposerAddress, 'Expected same proposer')
        assert.isTrue(proposal.startBlockNumber > lastBlock, 'Expected startBlockNumber > lastBlock')
        assert.equal(_lib.toStr(proposal.targetContractRegistryKey), _lib.toStr(targetContractRegistryKey), 'Expected same proposal.targetContractRegistryKey')
        assert.equal(proposal.targetContractAddress, targetContractAddress, 'Expected same proposal.targetContractAddress')
        assert.isTrue(proposal.callValue.eq(callValue), 'Expected same proposal.callValue')
        assert.equal(proposal.signature, signature, 'Expected same proposal.signature')
        assert.equal(proposal.callData, callData, 'Expected same proposal.callData')
        assert.equal(proposal.outcome, Outcome.InProgress, 'Expected same outcome')
        assert.isTrue(proposal.voteMagnitudeYes.isZero(), 'Expected same voteMagnitudeYes')
        assert.isTrue(proposal.voteMagnitudeNo.eq(defaultStakeAmount), 'Expected same voteMagnitudeNo')
        assert.equal(parseInt(proposal.numVotes), 1, 'Expected same numVotes')
  
        // Confirm all vote states - Vote.No for Voter, Vote.None for all others
        for (const account of accounts) {
          const voterVote = await governance.getVoteByProposalAndVoter.call(proposalId, account)
          if (account == voter1Address) {
            assert.equal(voterVote, vote)
          } else {
            assert.equal(voterVote, defaultVote)
          }
        }
      })

      it('Successfully vote multiple times with diff accounts', async () => {
        const vote1 = Vote.Yes
        const voteTx1 = await governance.submitProposalVote(proposalId, vote1, { from: voter1Address })
        const voteTxParsed1 = _lib.parseTx(voteTx1)
        assert.equal(parseInt(voteTxParsed1.event.args.vote), vote1, 'Expected same event.args.vote')
        assert.equal(parseInt(voteTxParsed1.event.args.previousVote), defaultVote, 'Expected same event.args.previousVote')
  
        const vote2 = Vote.Yes
        const voteTx2 = await governance.submitProposalVote(proposalId, vote2, { from: voter2Address })
        const voteTxParsed2 = _lib.parseTx(voteTx2)
        assert.equal(parseInt(voteTxParsed2.event.args.vote), vote2, 'Expected same event.args.vote')
        assert.equal(parseInt(voteTxParsed2.event.args.previousVote), defaultVote, 'Expected same event.args.previousVote')
  
        const vote3 = Vote.No
        const voteTx3 = await governance.submitProposalVote(proposalId, vote3, { from: voter1Address })
        const voteTxParsed3 = _lib.parseTx(voteTx3)
        assert.equal(parseInt(voteTxParsed3.event.args.vote), vote3, 'Expected same event.args.vote')
        assert.equal(parseInt(voteTxParsed3.event.args.previousVote), vote1, 'Expected same event.args.previousVote')
  
        const vote4 = Vote.Yes
        const voteTx4 = await governance.submitProposalVote(proposalId, vote4, { from: voter1Address })
        const voteTxParsed4 = _lib.parseTx(voteTx4)
        assert.equal(parseInt(voteTxParsed4.event.args.vote), vote4, 'Expected same event.args.vote')
        assert.equal(parseInt(voteTxParsed4.event.args.previousVote), vote3, 'Expected same event.args.previousVote')

        const vote5 = Vote.Yes
        const voteTx5 = await governance.submitProposalVote(proposalId, vote5, { from: voter1Address })
        const voteTxParsed5 = _lib.parseTx(voteTx5)
        assert.equal(parseInt(voteTxParsed5.event.args.vote), vote5, 'Expected same event.args.vote')
        assert.equal(parseInt(voteTxParsed5.event.args.previousVote), vote4, 'Expected same event.args.previousVote')
  
        // Confirm proposal state
        const proposal = await governance.getProposalById.call(proposalId)
        assert.equal(proposal.outcome, Outcome.InProgress, 'Expected same outcome')
        assert.isTrue(proposal.voteMagnitudeYes.eq(defaultStakeAmount.mul(_lib.toBN(2))), 'Expected same voteMagnitudeYes')
        assert.isTrue(proposal.voteMagnitudeNo.isZero(), 'Expected same voteMagnitudeNo')
        assert.equal(parseInt(proposal.numVotes), 2, 'Expected same numVotes')
  
        // Confirm vote states
        const voter1Vote = await governance.getVoteByProposalAndVoter.call(proposalId, voter1Address)
        assert.equal(voter1Vote, Vote.Yes)
        const voter2Vote = await governance.getVoteByProposalAndVoter.call(proposalId, voter2Address)
        assert.equal(voter2Vote, Vote.Yes)
      })
    })

    describe('Proposal evaluation', async () => {
      let proposalId, proposerAddress, slashAmountNum, slashAmount, targetAddress, voter1Address, voter2Address
      let voter1Vote, defaultVote, lastBlock, targetContractRegistryKey, targetContractAddress, callValue
      let signature, callData, outcome, returnData, initialTotalStake, initialStakeAcct2, initialTokenSupply
      let submitProposalTxReceipt, proposalStartBlockNumber, evaluateTxReceipt

      /** Define vars, submit proposal, submit votes, advance blocks */
      beforeEach(async () => {
        // Define vars
        proposalId = 1
        proposerAddress = stakerAccount1
        slashAmountNum = _lib.audToWei(500)
        slashAmount = _lib.toBN(slashAmountNum)
        targetAddress = stakerAccount2
        voter1Address = stakerAccount1
        voter2Address = stakerAccount2
        voter1Vote = Vote.Yes
        defaultVote = Vote.None
        lastBlock = (await _lib.getLatestBlock(web3)).number
        targetContractRegistryKey = delegateManagerKey
        targetContractAddress = delegateManager.address
        callValue = _lib.audToWei(0)
        signature = 'slash(uint256,address)'
        callData = _lib.abiEncode(['uint256', 'address'], [slashAmountNum, targetAddress])
        outcome = Outcome.Yes 
        returnData = null
  
        // Confirm initial Stake state
        initialTotalStake = await staking.totalStaked()
        assert.isTrue(initialTotalStake.eq(defaultStakeAmount.mul(_lib.toBN(2))))
        initialStakeAcct2 = await staking.totalStakedFor(targetAddress)
        assert.isTrue(initialStakeAcct2.eq(defaultStakeAmount))
        initialTokenSupply = await token.totalSupply()
  
        // Call submitProposal + submitProposalVote
        submitProposalTxReceipt = await governance.submitProposal(
          targetContractRegistryKey,
          callValue,
          signature,
          callData,
          proposalDescription,
          { from: proposerAddress }
        )
        await governance.submitProposalVote(proposalId, voter1Vote, { from: voter1Address })
  
        // Advance blocks to the next valid claim
        proposalStartBlockNumber = parseInt(_lib.parseTx(submitProposalTxReceipt).event.args.startBlockNumber)
        await time.advanceBlockTo(proposalStartBlockNumber + votingPeriod)
      })

      it('Fail to evaluate proposal with invalid proposalId', async () => {
        await _lib.assertRevert(
          governance.evaluateProposalOutcome(5, { from: proposerAddress }),
          "Governance::evaluateProposalOutcome: Must provide valid non-zero _proposalId."
        )
      })

      it('Fail to call evaluate proposal from non-staker', async () => {
        await _lib.assertRevert(
          governance.evaluateProposalOutcome(proposalId, { from: accounts[15] }),
          "Governance::evaluateProposalOutcome: Caller must be active staker with non-zero stake."
        )
      })

      it('Fail to evaluate proposal before votingPeriod has ended', async () => {
        submitProposalTxReceipt = await governance.submitProposal(
          targetContractRegistryKey,
          callValue,
          signature,
          callData,
          proposalDescription,
          { from: proposerAddress }
        )
        
        await _lib.assertRevert(
          governance.evaluateProposalOutcome(
            _lib.parseTx(submitProposalTxReceipt).event.args.proposalId,
            { from: proposerAddress }
          ),
          "Governance::evaluateProposalOutcome: Proposal votingPeriod must end before evaluation."
        )
      })

      it('Confirm proposal evaluated correctly + transaction executed', async () => {
        // Call evaluateProposalOutcome()
        evaluateTxReceipt = await governance.evaluateProposalOutcome(proposalId, { from: proposerAddress })
        
        // Confirm event logs (2 events)
        const [txParsedEvent0, txParsedEvent1] = _lib.parseTx(evaluateTxReceipt, true)
        assert.equal(txParsedEvent0.event.name, 'ProposalTransactionExecuted', 'Expected same event name')
        assert.equal(parseInt(txParsedEvent0.event.args.proposalId), proposalId, 'Expected same txParsedEvent0.event.args.proposalId')
        assert.equal(txParsedEvent0.event.args.success, true, 'Expected same txParsedEvent0.event.args.returnData')
        assert.equal(txParsedEvent0.event.args.returnData, returnData, 'Expected same txParsedEvent0.event.args.returnData')
        assert.equal(txParsedEvent1.event.name, 'ProposalOutcomeEvaluated', 'Expected same event name')
        assert.equal(parseInt(txParsedEvent1.event.args.proposalId), proposalId, 'Expected same event.args.proposalId')
        assert.equal(txParsedEvent1.event.args.outcome, outcome, 'Expected same event.args.outcome')
        assert.isTrue(txParsedEvent1.event.args.voteMagnitudeYes.eq(defaultStakeAmount), 'Expected same event.args.voteMagnitudeYes')
        assert.isTrue(txParsedEvent1.event.args.voteMagnitudeNo.isZero(), 'Expected same event.args.voteMagnitudeNo')
        assert.equal(parseInt(txParsedEvent1.event.args.numVotes), 1, 'Expected same event.args.numVotes')
  
        // Call getProposalById() and confirm same values
        const proposal = await governance.getProposalById.call(proposalId)
        assert.equal(parseInt(proposal.proposalId), proposalId, 'Expected same proposalId')
        assert.equal(proposal.proposer, proposerAddress, 'Expected same proposer')
        assert.isTrue(parseInt(proposal.startBlockNumber) > lastBlock, 'Expected startBlockNumber > lastBlock')
        assert.equal(_lib.toStr(proposal.targetContractRegistryKey), _lib.toStr(targetContractRegistryKey), 'Expected same proposal.targetContractRegistryKey')
        assert.equal(proposal.targetContractAddress, targetContractAddress, 'Expected same proposal.targetContractAddress')
        assert.equal(_lib.fromBN(proposal.callValue), callValue, 'Expected same proposal.callValue')
        assert.equal(proposal.signature, signature, 'Expected same proposal.signature')
        assert.equal(proposal.callData, callData, 'Expected same proposal.callData')
        assert.equal(proposal.outcome, outcome, 'Expected same outcome')
        assert.equal(parseInt(proposal.voteMagnitudeYes), defaultStakeAmount, 'Expected same voteMagnitudeYes')
        assert.equal(parseInt(proposal.voteMagnitudeNo), 0, 'Expected same voteMagnitudeNo')
        assert.equal(parseInt(proposal.numVotes), 1, 'Expected same numVotes')
  
        // Confirm all vote states - Vote.No for Voter, Vote.None for all others
        for (const account of accounts) {
          const voterVote = await governance.getVoteByProposalAndVoter.call(proposalId, account)
          if (account == voter1Address) {
            assert.equal(voterVote, voter1Vote)
          } else {
            assert.equal(voterVote, defaultVote)
          }
        }
  
        // Confirm Slash action succeeded by checking new Stake + Token values
        const finalStakeAcct2 = await staking.totalStakedFor(targetAddress)
        assert.isTrue(
          finalStakeAcct2.eq(defaultStakeAmount.sub(_lib.toBN(slashAmount)))
        )
        assert.isTrue(
          (_lib.toBN(initialTotalStake)).sub(_lib.toBN(slashAmount)).eq(await staking.totalStaked()),
          'Expected same total stake amount'
        )
        assert.equal(
          await token.totalSupply(),
          initialTokenSupply - slashAmount,
          "Expected same token total supply"
        )
      })

      it('Proposal with Outcome.No', async () => {
        // create new proposal
        submitProposalTxReceipt = await governance.submitProposal(
          targetContractRegistryKey,
          callValue,
          signature,
          callData,
          proposalDescription,
          { from: proposerAddress }
        )
        proposalId = _lib.parseTx(submitProposalTxReceipt).event.args.proposalId

        // Submit votes to achieve Outcome.No
        await governance.submitProposalVote(proposalId, Vote.No, { from: voter1Address })
        await governance.submitProposalVote(proposalId, Vote.No, { from: voter2Address })

        // Advance blocks to the next valid claim
        proposalStartBlockNumber = parseInt(_lib.parseTx(submitProposalTxReceipt).event.args.startBlockNumber)
        await time.advanceBlockTo(proposalStartBlockNumber + votingPeriod)

        outcome = Outcome.No
        const TWO = _lib.toBN(2)

        evaluateTxReceipt = await governance.evaluateProposalOutcome(
          _lib.parseTx(submitProposalTxReceipt).event.args.proposalId,
          { from: proposerAddress }
        )

        // Confirm event log
        const txParsed = _lib.parseTx(evaluateTxReceipt)
        assert.equal(txParsed.event.name, 'ProposalOutcomeEvaluated', 'Expected same event name')
        assert.equal(txParsed.event.args.outcome, outcome, 'Expected same event.args.outcome')
        assert.isTrue(txParsed.event.args.voteMagnitudeYes.isZero(), 'Expected same event.args.voteMagnitudeYes')
        assert.isTrue(txParsed.event.args.voteMagnitudeNo.eq(defaultStakeAmount.mul(TWO)), 'Expected same event.args.voteMagnitudeNo')
        assert.isTrue(txParsed.event.args.numVotes.eq(TWO), 'Expected same event.args.numVotes')
  
        // Call getProposalById() and confirm same values
        const proposal = await governance.getProposalById.call(proposalId)
        assert.equal(proposal.outcome, outcome, 'Expected same outcome')
        assert.isTrue(proposal.voteMagnitudeYes.isZero(), 'Expected same voteMagnitudeYes')
        assert.isTrue(proposal.voteMagnitudeNo.eq(defaultStakeAmount.mul(TWO)), 'Expected same voteMagnitudeNo')
        assert.isTrue(proposal.numVotes.eq(TWO), 'Expected same numVotes')
      })

      it('Confirm voting quorum restriction is enforced', async () => {
        // Call submitProposal + submitProposalVote
        submitProposalTxReceipt = await governance.submitProposal(
          targetContractRegistryKey,
          callValue,
          signature,
          callData,
          proposalDescription,
          { from: proposerAddress }
        )
        proposalId = _lib.parseTx(submitProposalTxReceipt).event.args.proposalId
        outcome = Outcome.Invalid

        // Advance blocks to the next valid claim
        proposalStartBlockNumber = parseInt(_lib.parseTx(submitProposalTxReceipt).event.args.startBlockNumber)
        await time.advanceBlockTo(proposalStartBlockNumber + votingPeriod)

        evaluateTxReceipt = await governance.evaluateProposalOutcome(
          _lib.parseTx(submitProposalTxReceipt).event.args.proposalId,
          { from: proposerAddress }
        )

        // Confirm event log
        const txParsed = _lib.parseTx(evaluateTxReceipt)
        assert.equal(txParsed.event.name, 'ProposalOutcomeEvaluated', 'Expected same event name')
        assert.equal(parseInt(txParsed.event.args.proposalId), proposalId, 'Expected same event.args.proposalId')
        assert.equal(txParsed.event.args.outcome, outcome, 'Expected same event.args.outcome')
        assert.isTrue(txParsed.event.args.voteMagnitudeYes.isZero(), 'Expected same event.args.voteMagnitudeYes')
        assert.isTrue(txParsed.event.args.voteMagnitudeNo.isZero(), 'Expected same event.args.voteMagnitudeNo')
        assert.isTrue(txParsed.event.args.numVotes.isZero(), 'Expected same event.args.numVotes')
  
        // Call getProposalById() and confirm same values
        const proposal = await governance.getProposalById.call(proposalId)
        assert.equal(proposal.outcome, outcome, 'Expected same outcome')
        assert.isTrue(proposal.voteMagnitudeYes.isZero(), 'Expected same voteMagnitudeYes')
        assert.isTrue(proposal.voteMagnitudeNo.isZero(), 'Expected same voteMagnitudeNo')
        assert.isTrue(proposal.numVotes.isZero(), 'Expected same numVotes')
      })
  
      it('Confirm Repeated evaluateProposal call fails', async () => {
        // Call evaluateProposalOutcome()
        evaluateTxReceipt = await governance.evaluateProposalOutcome(proposalId, { from: proposerAddress })
        
        await _lib.assertRevert(
          governance.evaluateProposalOutcome(proposalId, { from: proposerAddress }),
          "Governance::evaluateProposalOutcome: Cannot evaluate inactive proposal."
        )
      })

      it('evaluateProposal fails after targetContract has been upgraded', async () => {
        const testContract = await TestContract.new()
        await testContract.initialize(registry.address)

        // Upgrade contract registered at targetContractRegistryKey
        await registry.upgradeContract(targetContractRegistryKey, testContract.address, { from: proxyDeployerAddress })

        await _lib.assertRevert(
          // Call evaluateProposalOutcome()
          governance.evaluateProposalOutcome(proposalId, { from: proposerAddress }),
          "Registered contract address for targetContractRegistryKey has changed"
        )
      })

      it('Call evaluateProposal where transaction execution fails', async () => {
        initialStakeAcct2 = await staking.totalStakedFor(targetAddress)
        assert.isTrue(initialStakeAcct2.eq(defaultStakeAmount))

        // Reduce stake amount below proposed slash amount
        const decreaseStakeAmount = _lib.audToWeiBN(700)
        // Request decrease in stake
        await serviceProviderFactory.requestDecreaseStake(decreaseStakeAmount, { from: stakerAccount2 })
        let requestInfo = await serviceProviderFactory.getPendingDecreaseStakeRequest(stakerAccount2)
        // Advance to valid block
        await time.advanceBlockTo(requestInfo.lockupExpiryBlock)
        await serviceProviderFactory.decreaseStake({ from: stakerAccount2 })
        const decreasedStakeAcct2 = await staking.totalStakedFor.call(stakerAccount2)
        assert.isTrue(decreasedStakeAcct2.eq(initialStakeAcct2.sub(decreaseStakeAmount)))

        // Call evaluateProposalOutcome and confirm that transaction execution failed and proposal outcome is No.
        evaluateTxReceipt = await governance.evaluateProposalOutcome(proposalId, { from: proposerAddress })
        
        // Confirm event logs (2 events)
        const [txParsedEvent0, txParsedEvent1] = _lib.parseTx(evaluateTxReceipt, true)
        assert.equal(txParsedEvent0.event.name, 'ProposalTransactionExecuted', 'Expected same event name')
        assert.equal(txParsedEvent0.event.args.proposalId, proposalId, 'Expected same txParsedEvent0.event.args.proposalId')
        assert.equal(txParsedEvent0.event.args.success, false, 'Expected same txParsedEvent0.event.args.success')
        // TODO - confirm that returnData = web3.utils.utf8ToHex("Cannot slash more than total currently staked")
        // reference: https://solidity.readthedocs.io/en/develop/abi-spec.html#use-of-dynamic-types
        // assert.equal(txParsedEvent0.event.args.returnData, returnData, 'Expected same txParsedEvent0.event.args.returnData')
        assert.equal(txParsedEvent1.event.name, 'ProposalOutcomeEvaluated', 'Expected same event name')
        assert.equal(parseInt(txParsedEvent1.event.args.proposalId), proposalId, 'Expected same event.args.proposalId')
        assert.equal(txParsedEvent1.event.args.outcome, Outcome.TxFailed, 'Expected same event.args.outcome')
        assert.isTrue(txParsedEvent1.event.args.voteMagnitudeYes.eq(defaultStakeAmount), 'Expected same event.args.voteMagnitudeYes')
        assert.isTrue(txParsedEvent1.event.args.voteMagnitudeNo.isZero(), 'Expected same event.args.voteMagnitudeNo')
        assert.equal(parseInt(txParsedEvent1.event.args.numVotes), 1, 'Expected same event.args.numVotes')
  
        // Call getProposalById() and confirm same values
        const proposal = await governance.getProposalById.call(proposalId)
        assert.equal(parseInt(proposal.proposalId), proposalId, 'Expected same proposalId')
        assert.equal(proposal.proposer, proposerAddress, 'Expected same proposer')
        assert.isTrue(parseInt(proposal.startBlockNumber) > lastBlock, 'Expected startBlockNumber > lastBlock')
        assert.equal(_lib.toStr(proposal.targetContractRegistryKey), _lib.toStr(targetContractRegistryKey), 'Expected same proposal.targetContractRegistryKey')
        assert.equal(proposal.targetContractAddress, targetContractAddress, 'Expected same proposal.targetContractAddress')
        assert.equal(_lib.fromBN(proposal.callValue), callValue, 'Expected same proposal.callValue')
        assert.equal(proposal.signature, signature, 'Expected same proposal.signature')
        assert.equal(proposal.callData, callData, 'Expected same proposal.callData')
        assert.equal(proposal.outcome, Outcome.TxFailed, 'Expected same outcome')
        assert.equal(parseInt(proposal.voteMagnitudeYes), defaultStakeAmount, 'Expected same voteMagnitudeYes')
        assert.equal(parseInt(proposal.voteMagnitudeNo), 0, 'Expected same voteMagnitudeNo')
        assert.equal(parseInt(proposal.numVotes), 1, 'Expected same numVotes')
  
        // Confirm all vote states - Vote.No for Voter, Vote.None for all others
        for (const account of accounts) {
          const voterVote = await governance.getVoteByProposalAndVoter.call(proposalId, account)
          if (account == voter1Address) {
            assert.equal(voterVote, voter1Vote)
          } else {
            assert.equal(voterVote, defaultVote)
          }
        }
  
        // Confirm Slash action failed by checking new Stake + Token values
        const finalStakeAcct2 = await staking.totalStakedFor(targetAddress)
        assert.isTrue(finalStakeAcct2.eq(decreasedStakeAcct2), 'ye')
        assert.isTrue(
          (await staking.totalStaked()).eq(initialTotalStake.sub(decreaseStakeAmount)),
          'Expected total stake amount to be unchanged'
        )
        assert.isTrue((await token.totalSupply()).eq(initialTokenSupply), "Expected total token supply to be unchanged")
      })

      describe('Veto logic', async () => {
        it('Ensure only guardian can veto', async () => {
          // Fail to veto from non-guardian address
          await _lib.assertRevert(
            governance.vetoProposal(proposalId, { from: stakerAccount1 }),
            'Governance::vetoProposal: Only guardian can veto proposals'
          )
        })

        it('Fail to veto proposal with invalid proposalId', async () => {
          const invalidProposalId = 5
          await _lib.assertRevert(
            governance.vetoProposal(invalidProposalId, { from: guardianAddress }),
            "Governance::vetoProposal: Must provide valid non-zero _proposalId."
          )
        })

        it('Ensure only active proposal can be vetoed', async () => {
          await governance.evaluateProposalOutcome(proposalId, { from: proposerAddress })

          // Ensure proposal.outcome != InProgress
          assert.notEqual(
            (await governance.getProposalById.call(proposalId)).outcome,
            Outcome.InProgress,
            'Expected outcome != InProgress'
          )
          
          // Fail to veto due to inactive proposal
          await _lib.assertRevert(
            governance.vetoProposal(proposalId, { from: guardianAddress }),
            'Governance::vetoProposal: Cannot veto inactive proposal.'
          )
        })

        it('Successfully veto proposal + ensure further actions are blocked', async () => {
          const vetoTxReceipt = await governance.vetoProposal(proposalId, { from: guardianAddress })

          // Confirm event log
          const vetoTx = _lib.parseTx(vetoTxReceipt)
          assert.equal(vetoTx.event.name, 'ProposalVetoed', 'event.name')
          assert.equal(parseInt(vetoTx.event.args.proposalId), proposalId, 'event.args.proposalId')

          // Call getProposalById() and confirm expected outcome
          const proposal = await governance.getProposalById.call(proposalId)
          assert.equal(proposal.outcome, Outcome.No, 'outcome')
          assert.equal(parseInt(proposal.voteMagnitudeYes), defaultStakeAmount, 'voteMagnitudeYes')
          assert.equal(parseInt(proposal.voteMagnitudeNo), 0, 'voteMagnitudeNo')
          assert.equal(parseInt(proposal.numVotes), 1, 'numVotes')

          // Confirm that further actions are blocked
          await _lib.assertRevert(
            governance.submitProposalVote(proposalId, voter1Vote, { from: voter1Address }),
            "Governance::submitProposalVote: Cannot vote on inactive proposal."
          )
          
          await _lib.assertRevert(
            governance.evaluateProposalOutcome(proposalId, { from: proposerAddress }),
            "Governance::evaluateProposalOutcome: Cannot evaluate inactive proposal."
          )
        })
      })
    })
  })

  describe('Upgrade Contract Proposal', async () => {
    it('Upgrade Contract Proposal', async () => {
      // Confirm staking.newFunction() not callable before upgrade
      const stakingCopy = await StakingUpgraded.at(staking.address)
      await _lib.assertRevert(stakingCopy.newFunction.call({ from: proxyDeployerAddress }), 'revert')
  
      // Deploy new logic contract to later upgrade to
      const stakingUpgraded0 = await StakingUpgraded.new({ from: proxyAdminAddress })
      
      // Define vars
      const targetContractRegistryKey = stakingProxyKey
      const targetContractAddress = stakingProxy.address
      const callValue = _lib.audToWei(0)
      const signature = 'upgradeTo(address)'
      const callData = _lib.abiEncode(['address'], [stakingUpgraded0.address])
      const returnData = null
  
      const proposerAddress = stakerAccount1
      const voterAddress = stakerAccount1
      const outcome = Outcome.Yes
      const lastBlock = (await _lib.getLatestBlock(web3)).number
      
      // Submit proposal
      const submitTxReceipt = await governance.submitProposal(
        targetContractRegistryKey,
        callValue,
        signature,
        callData,
        proposalDescription,
        { from: proposerAddress }
      )
      const proposalId = _lib.parseTx(submitTxReceipt).event.args.proposalId
  
      // Submit proposal vote for Yes
      await governance.submitProposalVote(proposalId, Vote.Yes, { from: voterAddress })
  
      // Advance blocks to after proposal evaluation period
      const proposalStartBlock = parseInt(_lib.parseTx(submitTxReceipt).event.args.startBlockNumber)
      await time.advanceBlockTo(proposalStartBlock + votingPeriod)

      // Call evaluateProposalOutcome()
      const evaluateTxReceipt = await governance.evaluateProposalOutcome(proposalId, { from: proposerAddress })
  
      // Confirm event log states - ProposalTransactionExecuted, ProposalOutcomeEvaluated
      const [txParsedEvent0, txParsedEvent1] = _lib.parseTx(evaluateTxReceipt, true)
      assert.equal(txParsedEvent0.event.name, 'ProposalTransactionExecuted', 'Expected event.name')
      assert.equal(parseInt(txParsedEvent0.event.args.proposalId), proposalId, 'Expected event.args.proposalId')
      assert.equal(txParsedEvent0.event.args.success, true, 'Expected event.args.returnData')
      assert.equal(txParsedEvent0.event.args.returnData, returnData, 'Expected event.args.returnData')
      assert.equal(txParsedEvent1.event.name, 'ProposalOutcomeEvaluated', 'Expected same event name')
      assert.equal(parseInt(txParsedEvent1.event.args.proposalId), proposalId, 'Expected same event.args.proposalId')
      assert.equal(txParsedEvent1.event.args.outcome, outcome, 'Expected same event.args.outcome')
      assert.isTrue(txParsedEvent1.event.args.voteMagnitudeYes.eq(defaultStakeAmount), 'Expected same event.args.voteMagnitudeYes')
      assert.isTrue(txParsedEvent1.event.args.voteMagnitudeNo.isZero(), 'Expected same event.args.voteMagnitudeNo')
      assert.equal(parseInt(txParsedEvent1.event.args.numVotes), 1, 'Expected same event.args.numVotes')

      // Call getProposalById() and confirm same values
      const proposal = await governance.getProposalById.call(proposalId)
      assert.equal(parseInt(proposal.proposalId), proposalId, 'Expected same proposalId')
      assert.equal(proposal.proposer, proposerAddress, 'Expected same proposer')
      assert.isTrue(parseInt(proposal.startBlockNumber) > lastBlock, 'Expected startBlockNumber > lastBlock')
      assert.equal(_lib.toStr(proposal.targetContractRegistryKey), _lib.toStr(targetContractRegistryKey), 'Expected same proposal.targetContractRegistryKey')
      assert.equal(proposal.targetContractAddress, targetContractAddress, 'Expected same proposal.targetContractAddress')
      assert.equal(_lib.fromBN(proposal.callValue), callValue, 'Expected same proposal.callValue')
      assert.equal(proposal.signature, signature, 'Expected same proposal.signature')
      assert.equal(proposal.callData, callData, 'Expected same proposal.callData')
      assert.equal(proposal.outcome, outcome, 'Expected same outcome')
      assert.equal(parseInt(proposal.voteMagnitudeYes), defaultStakeAmount, 'Expected same voteMagnitudeYes')
      assert.equal(parseInt(proposal.voteMagnitudeNo), 0, 'Expected same voteMagnitudeNo')
      assert.equal(parseInt(proposal.numVotes), 1, 'Expected same numVotes')

      // Confirm that contract was upgraded by ensuring staking.newFunction() call succeeds
      const stakingCopy2 = await StakingUpgraded.at(staking.address)
      const newFnResp = await stakingCopy2.newFunction.call({ from: proxyDeployerAddress })
      assert.equal(newFnResp, 5)

      // Confirm that proxy contract's implementation address has upgraded
      assert.equal(
        await stakingProxy.implementation.call({ from: proxyAdminAddress }),
        stakingUpgraded0.address,
        'Expected updated proxy implementation address'
      )
    })
  })

  describe('Guardian execute transactions', async () => {    
    let slashAmount, targetAddress, targetContractRegistryKey, targetContractAddress
    let callValue, signature, callData, returnData

    beforeEach(async () => {
      slashAmount = _lib.toBN(1)
      targetAddress = stakerAccount2
      targetContractRegistryKey = delegateManagerKey
      targetContractAddress = delegateManager.address
      callValue = _lib.toBN(0)
      signature = 'slash(uint256,address)'
      callData = _lib.abiEncode(['uint256', 'address'], [_lib.fromBN(slashAmount), targetAddress])
      returnData = null
    })

    it('Fail to call from non-guardian address', async () => {
      await _lib.assertRevert(
        governance.guardianExecuteTransaction(
          targetContractRegistryKey,
          callValue,
          signature,
          callData,
          { from: stakerAccount1 }
        ),
        "Governance::guardianExecuteTransaction: Only guardian."
      )
    })

    it('Slash staker', async () => {
      // Confirm initial Stake state
      const initialTotalStake = await staking.totalStaked()
      assert.isTrue(initialTotalStake.eq(defaultStakeAmount.mul(_lib.toBN(2))))
      const initialStakeAcct2 = await staking.totalStakedFor(targetAddress)
      assert.isTrue(initialStakeAcct2.eq(defaultStakeAmount))
      const initialTokenSupply = await token.totalSupply()

      // Execute transaction
      const guardianExecTxReceipt = await governance.guardianExecuteTransaction(
        targetContractRegistryKey,
        callValue,
        signature,
        callData,
        { from: guardianAddress }
      )

      const guardianExecTx = _lib.parseTx(guardianExecTxReceipt)
      assert.equal(guardianExecTx.event.name, 'GuardianTransactionExecuted', 'event.name')
      assert.equal(guardianExecTx.event.args.targetContractAddress, targetContractAddress, 'event.args.targetContractAddress')
      assert.isTrue(guardianExecTx.event.args.callValue.eq(callValue), 'event.args.callValue')
      assert.equal(
        guardianExecTx.event.args.signature,
        _lib.keccak256(web3.utils.utf8ToHex(signature)),
        'event.args.signature'
      )
      assert.equal(
        guardianExecTx.event.args.callData,
        _lib.keccak256(callData),
        'event.args.callData'
      )
      assert.equal(guardianExecTx.event.args.success, true, 'event.args.success')
      assert.equal(guardianExecTx.event.args.returnData, returnData, 'event.args.returnData')

      // Confirm Slash action succeeded by checking new Stake + Token values
      const finalStakeAcct2 = await staking.totalStakedFor(targetAddress)
      assert.isTrue(
        finalStakeAcct2.eq(defaultStakeAmount.sub(slashAmount))
      )
      assert.isTrue(
        (initialTotalStake.sub(slashAmount)).eq(await staking.totalStaked()),
        'Expected same total stake amount'
      )
      assert.isTrue(
        (await token.totalSupply()).eq(initialTokenSupply.sub(slashAmount)),
        "Expected same token total supply"
      )
    })

    it('Fail to execute transaction on unregistered targetContract', async () => {
      const invalidRegistryKey = web3.utils.utf8ToHex('invalidRegistryKey')

      await _lib.assertRevert(
        governance.guardianExecuteTransaction(
          invalidRegistryKey,
          callValue,
          signature,
          callData,
          { from: guardianAddress }
        ),
        "Governance::guardianExecuteTransaction: _targetContractRegistryKey must point to valid registered contract"
      )
    })

    it('Fail to execute transaction with no signature', async () => {
      await _lib.assertRevert(
        governance.guardianExecuteTransaction(
          targetContractRegistryKey,
          callValue,
          '',
          callData,
          { from: guardianAddress }
        ),
        "Governance::guardianExecuteTransaction: _signature cannot be empty."
      )
    })

    it.skip('Fail to slash too large amount', async () => {

    })

    it.skip('TODO - Upgrade contract', async () => { })
  })

  describe.skip('Proposal to upgrade governance contract', async () => { })
})
