const ethers = require('ethers')
const BigNum = require('bignumber.js')

import * as _lib from './_lib/lib.js'
const encodeCall = require('../utils/encodeCall')

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

const toBN = val => web3.utils.toBN(val)

const fromBN = val => val.toNumber()

const audToWei = val => web3.utils.toWei(val.toString(), 'ether')

const audToWeiBN = aud => toBN(audToWei(aud))

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
  let serviceProviderFactory, claimsManager, delegateManager, governance0, governanceProxy, governance

  const votingPeriod = 10
  const votingQuorum = 1
  const [treasuryAddress, proxyAdminAddress, proxyDeployerAddress] = accounts
  const guardianAddress = proxyDeployerAddress
  const protocolOwnerAddress = treasuryAddress
  const testDiscProvType = web3.utils.utf8ToHex('discovery-provider')
  const testEndpoint1 = 'https://localhost:5000'
  const testEndpoint2 = 'https://localhost:5001'

  const defaultStakeAmount = audToWeiBN(1000)
  const proposalDescription = "TestDescription"
  const stakerAccount1 = accounts[10]
  const stakerAccount2 = accounts[11]
  const delegatorAccount1 = accounts[12]

  const registerServiceProvider = async (type, endpoint, amount, account) => {
    // Approve staking transfer
    await token.approve(staking.address, amount, { from: account })

    const tx = await serviceProviderFactory.register(
      type,
      endpoint,
      amount,
      account,
      { from: account }
    )

    const args = tx.logs.find(log => log.event === 'RegisteredServiceProvider').args
    args.stakeAmount = args._stakeAmount
    args.spID = args._spID
    return args
  }

  /** Deploy Registry, AudiusAdminUpgradeabilityProxy, AudiusToken, Staking, and Governance contracts. */
  beforeEach(async () => {
    token = await AudiusToken.new({ from: treasuryAddress })
    await token.initialize()
    registry = await Registry.new({ from: treasuryAddress })
    await registry.initialize()

    // Deploy Governance contract
    governance0 = await Governance.new({ from: proxyDeployerAddress })
    const governanceCallData = encodeCall(
      'initialize',
      ['address', 'bytes32', 'uint256', 'uint256', 'address'],
      [registry.address, stakingProxyKey, votingPeriod, votingQuorum, proxyDeployerAddress]
    )
    governanceProxy = await AudiusAdminUpgradeabilityProxy.new(
      governance0.address,
      proxyAdminAddress,
      governanceCallData,
      registry.address,
      governanceKey,
      { from: proxyDeployerAddress }
    )
    governance = await Governance.at(governanceProxy.address)
    await registry.addContract(governanceKey, governance.address, { from: protocolOwnerAddress })

    // Create initialization data
    let stakingInitializeData = encodeCall(
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
    // Set up staking
    staking0 = await Staking.new({ from: proxyAdminAddress })
    stakingProxy = await AudiusAdminUpgradeabilityProxy.new(
      staking0.address,
      proxyAdminAddress,
      stakingInitializeData,
      registry.address,
      governanceKey,
      { from: proxyDeployerAddress }
    )
    staking = await Staking.at(stakingProxy.address)
    await registry.addContract(stakingProxyKey, stakingProxy.address, { from: treasuryAddress })

    // Deploy service type manager
    let controllerAddress = accounts[9]
    let serviceTypeInitializeData = encodeCall(
      'initialize',
      ['address', 'address', 'bytes32'],
      [registry.address, controllerAddress, governanceKey]
    )
    let serviceTypeManager0 = await ServiceTypeManager.new({ from: treasuryAddress })
    let serviceTypeManagerProxy = await AudiusAdminUpgradeabilityProxy.new(
      serviceTypeManager0.address,
      proxyAdminAddress,
      serviceTypeInitializeData,
      registry.address,
      governanceKey,
      { from: proxyAdminAddress }
    )
    await registry.addContract(serviceTypeManagerProxyKey, serviceTypeManagerProxy.address, { from: treasuryAddress })
    let serviceTypeManager = await ServiceTypeManager.at(serviceTypeManagerProxy.address)
    // Register discovery provider
    await serviceTypeManager.addServiceType(
      testDiscProvType,
      audToWeiBN(5),
      audToWeiBN(10000000),
      { from: controllerAddress })

    // Deploy + Register ServiceProviderFactory contract
    let serviceProviderFactory0 = await ServiceProviderFactory.new({ from: treasuryAddress })
    const serviceProviderFactoryCalldata = encodeCall(
      'initialize',
      ['address', 'bytes32', 'bytes32', 'bytes32', 'bytes32'],
      [registry.address, stakingProxyKey, delegateManagerKey, governanceKey, serviceTypeManagerProxyKey]
    )
    let serviceProviderFactoryProxy = await AudiusAdminUpgradeabilityProxy.new(
      serviceProviderFactory0.address,
      proxyAdminAddress,
      serviceProviderFactoryCalldata,
      registry.address,
      governanceKey,
      { from: proxyAdminAddress }
    )
    serviceProviderFactory = await ServiceProviderFactory.at(serviceProviderFactoryProxy.address)
    await registry.addContract(serviceProviderFactoryKey, serviceProviderFactoryProxy.address, { from: treasuryAddress })

    // Deploy + register claimsManagerProxy
    claimsManager0 = await ClaimsManager.new({ from: proxyDeployerAddress })
    const claimsInitializeCallData = encodeCall(
      'initialize',
      ['address', 'address', 'address', 'bytes32', 'bytes32', 'bytes32'],
      [token.address, registry.address, controllerAddress, stakingProxyKey, serviceProviderFactoryKey, delegateManagerKey]
    )
    claimsManagerProxy = await AudiusAdminUpgradeabilityProxy.new(
      claimsManager0.address,
      proxyAdminAddress,
      claimsInitializeCallData,
      registry.address,
      governanceKey,
      { from: proxyDeployerAddress }
    )
    claimsManager = await ClaimsManager.at(claimsManagerProxy.address)
    await registry.addContract(
      claimsManagerProxyKey,
      claimsManagerProxy.address,
      { from: protocolOwnerAddress }
    )

    // Register new contract as a minter, from the same address that deployed the contract
    await token.addMinter(claimsManager.address, { from: protocolOwnerAddress })

    // Deploy DelegateManager contract
    const delegateManagerInitializeData = encodeCall(
      'initialize',
      ['address', 'address', 'bytes32', 'bytes32', 'bytes32', 'bytes32'],
      [token.address, registry.address, governanceKey, stakingProxyKey, serviceProviderFactoryKey, claimsManagerProxyKey]
    )
    let delegateManager0 = await DelegateManager.new({ from: proxyDeployerAddress })
    let delegateManagerProxy = await AudiusAdminUpgradeabilityProxy.new(
      delegateManager0.address,
      proxyAdminAddress,
      delegateManagerInitializeData,
      registry.address,
      governanceKey,
      { from: proxyDeployerAddress }
    )
    delegateManager = await DelegateManager.at(delegateManagerProxy.address)
    await registry.addContract(delegateManagerKey, delegateManagerProxy.address, { from: protocolOwnerAddress })
  })

  /** Transfer tokens & register 2 SPs */
  beforeEach(async () => {
    // Transfer 1000 tokens to stakerAccount1, stakerAccount2, and delegatorAccount1
    await token.transfer(stakerAccount1, defaultStakeAmount, { from: treasuryAddress })
    await token.transfer(stakerAccount2, defaultStakeAmount, { from: treasuryAddress })
    await token.transfer(delegatorAccount1, defaultStakeAmount, { from: treasuryAddress })

    // Record initial staker account token balance
    const initialBalance = await token.balanceOf(stakerAccount1)

    // Register two SPs with stake
    const tx1 = await registerServiceProvider(
      testDiscProvType,
      testEndpoint1,
      defaultStakeAmount,
      stakerAccount1
    )
    await registerServiceProvider(
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

  describe('Slash proposal', async () => {
    
    it('Initial state - Ensure no Proposals exist yet', async () => {
      await _lib.assertRevert(governance.getProposalById(0), 'Must provide valid non-zero _proposalId')
      await _lib.assertRevert(governance.getProposalById(1), 'Must provide valid non-zero _proposalId')
    })

    it('Should fail to Submit Proposal for unregistered target contract', async () => {
      const proposerAddress = accounts[10]
      const slashAmount = toBN(1)
      const targetAddress = accounts[11]
      const targetContractRegistryKey = web3.utils.utf8ToHex("blahblah")
      const callValue = toBN(0)
      const signature = 'slash(uint256,address)'
      const callData = abiEncode(['uint256', 'address'], [fromBN(slashAmount), targetAddress])

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

    it('Submit Proposal for Slash', async () => {
      const proposalId = 1
      const proposerAddress = accounts[10]
      const slashAmount = toBN(1)
      const targetAddress = accounts[11]
      const lastBlock = (await _lib.getLatestBlock(web3)).number
      const targetContractRegistryKey = delegateManagerKey
      const targetContractAddress = delegateManager.address
      const callValue = toBN(0)
      const signature = 'slash(uint256,address)'
      const callData = abiEncode(['uint256', 'address'], [slashAmount.toNumber(), targetAddress])

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

    it('Vote on Proposal for Slash', async () => {
      const proposalId = 1
      const proposerAddress = stakerAccount1
      const slashAmount = toBN(1)
      const targetAddress = stakerAccount2
      const voterAddress = stakerAccount1
      const vote = Vote.No
      const defaultVote = Vote.None
      const lastBlock = (await _lib.getLatestBlock(web3)).number
      const targetContractRegistryKey = delegateManagerKey
      const targetContractAddress = delegateManager.address
      const callValue = toBN(0)
      const signature = 'slash(uint256,address)'
      const callData = abiEncode(['uint256', 'address'], [fromBN(slashAmount), targetAddress])

      // Call submitProposal
      await governance.submitProposal(
        targetContractRegistryKey,
        callValue,
        signature,
        callData,
        proposalDescription,
        { from: proposerAddress }
      )

      // Call submitProposalVote()
      const txReceipt = await governance.submitProposalVote(proposalId, vote, { from: voterAddress })

      // Confirm event log
      const txParsed = _lib.parseTx(txReceipt)
      assert.equal(txParsed.event.name, 'ProposalVoteSubmitted', 'Expected same event name')
      assert.equal(parseInt(txParsed.event.args.proposalId), proposalId, 'Expected same event.args.proposalId')
      assert.equal(txParsed.event.args.voter, voterAddress, 'Expected same event.args.voter')
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
        if (account == voterAddress) {
          assert.equal(voterVote, vote)
        } else {
          assert.equal(voterVote, defaultVote)
        }
      }
    })

    describe('Proposal evaluation', async () => {
      let proposalId, proposerAddress, slashAmountNum, slashAmount, targetAddress, voterAddress, vote, defaultVote
      let lastBlock, targetContractRegistryKey, targetContractAddress, callValue, signature, callData
      let outcome, txHash, returnData, initialTotalStake, initialStakeAcct2, initialTokenSupply
      let submitProposalTxReceipt, proposalStartBlockNumber, evaluateTxReceipt

      /** Define vars, submit proposal, submit votes, advance blocks */
      beforeEach(async () => {
        // Define vars
        proposalId = 1
        proposerAddress = stakerAccount1
        slashAmountNum = audToWei(500)
        slashAmount = toBN(slashAmountNum)
        targetAddress = stakerAccount2
        voterAddress = stakerAccount1
        vote = Vote.Yes
        defaultVote = Vote.None
        lastBlock = (await _lib.getLatestBlock(web3)).number
        targetContractRegistryKey = delegateManagerKey
        targetContractAddress = delegateManager.address
        callValue = audToWei(0)
        signature = 'slash(uint256,address)'
        callData = abiEncode(['uint256', 'address'], [slashAmountNum, targetAddress])
        outcome = Outcome.Yes 
        txHash = keccak256(
          abiEncode(
            ['address', 'uint256', 'string', 'bytes'],
            [targetContractAddress, callValue, signature, callData]
          )
        )
        returnData = null
  
        // Confirm initial Stake state
        initialTotalStake = await staking.totalStaked()
        assert.isTrue(initialTotalStake.eq(defaultStakeAmount.mul(toBN(2))))
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
        await governance.submitProposalVote(proposalId, vote, { from: voterAddress })
  
        // Advance blocks to the next valid claim
        proposalStartBlockNumber = parseInt(_lib.parseTx(submitProposalTxReceipt).event.args.startBlockNumber)
        await _lib.advanceToTargetBlock(proposalStartBlockNumber + votingPeriod, web3)
      })

      it('Confirm proposal evaluated correctly + transaction executed', async () => {
        // Call evaluateProposalOutcome()
        evaluateTxReceipt = await governance.evaluateProposalOutcome(proposalId, { from: proposerAddress })
        
        // Confirm event logs (2 events)
        const [txParsedEvent0, txParsedEvent1] = _lib.parseTx(evaluateTxReceipt, true)
        assert.equal(txParsedEvent0.event.name, 'TransactionExecuted', 'Expected same event name')
        assert.equal(parseInt(txParsedEvent0.event.args.proposalId), proposalId, 'Expected same txParsedEvent0.event.args.proposalId')
        assert.equal(txParsedEvent0.event.args.txHash, txHash, 'Expected same txParsedEvent0.event.args.txHash')
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
        assert.equal(fromBN(proposal.callValue), callValue, 'Expected same proposal.callValue')
        assert.equal(proposal.signature, signature, 'Expected same proposal.signature')
        assert.equal(proposal.callData, callData, 'Expected same proposal.callData')
        assert.equal(proposal.outcome, outcome, 'Expected same outcome')
        assert.equal(parseInt(proposal.voteMagnitudeYes), defaultStakeAmount, 'Expected same voteMagnitudeYes')
        assert.equal(parseInt(proposal.voteMagnitudeNo), 0, 'Expected same voteMagnitudeNo')
        assert.equal(parseInt(proposal.numVotes), 1, 'Expected same numVotes')
  
        // Confirm all vote states - Vote.No for Voter, Vote.None for all others
        for (const account of accounts) {
          const voterVote = await governance.getVoteByProposalAndVoter.call(proposalId, account)
          if (account == voterAddress) {
            assert.equal(voterVote, vote)
          } else {
            assert.equal(voterVote, defaultVote)
          }
        }
  
        // Confirm Slash action succeeded by checking new Stake + Token values
        const finalStakeAcct2 = await staking.totalStakedFor(targetAddress)
        assert.isTrue(
          finalStakeAcct2.eq(defaultStakeAmount.sub(web3.utils.toBN(slashAmount)))
        )
        assert.isTrue(
          (web3.utils.toBN(initialTotalStake)).sub(web3.utils.toBN(slashAmount)).eq(await staking.totalStaked()),
          'Expected same total stake amount'
        )
        assert.equal(
          await token.totalSupply(),
          initialTokenSupply - slashAmount,
          "Expected same token total supply"
        )
      })
  
      it('Confirm Repeated evaluateProposal call fails', async () => {
        // Call evaluateProposalOutcome()
        evaluateTxReceipt = await governance.evaluateProposalOutcome(proposalId, { from: proposerAddress })
        
        await _lib.assertRevert(
          governance.evaluateProposalOutcome(proposalId, { from: proposerAddress }),
          "Governance::evaluateProposalOutcome:Cannot evaluate inactive proposal."
        )
      })

      it('evaluateProposal fails after targetContract has been upgraded', async () => {
        const testContract = await TestContract.new()
        await testContract.initialize(registry.address)

        // Upgrade contract registered at targetContractRegistryKey
        await registry.upgradeContract(targetContractRegistryKey, testContract.address)
        
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
        const decreaseStakeAmount = audToWeiBN(700)
        await serviceProviderFactory.decreaseStake(
          decreaseStakeAmount,
          { from: stakerAccount2 }
        )
        const decreasedStakeAcct2 = await staking.totalStakedFor.call(stakerAccount2)
        assert.isTrue(decreasedStakeAcct2.eq(initialStakeAcct2.sub(decreaseStakeAmount)))

        // Call evaluateProposalOutcome and confirm that transaction execution failed and proposal outcome is No.
        evaluateTxReceipt = await governance.evaluateProposalOutcome(proposalId, { from: proposerAddress })
        
        // Confirm event logs (2 events)
        const [txParsedEvent0, txParsedEvent1] = _lib.parseTx(evaluateTxReceipt, true)
        assert.equal(txParsedEvent0.event.name, 'TransactionExecuted', 'Expected same event name')
        assert.equal(txParsedEvent0.event.args.proposalId, proposalId, 'Expected same txParsedEvent0.event.args.txHash')
        assert.equal(txParsedEvent0.event.args.txHash, txHash, 'Expected same txParsedEvent0.event.args.txHash')
        assert.equal(txParsedEvent0.event.args.success, false, 'Expected same txParsedEvent0.event.args.returnData')

        // TODO - confirm that returnData = "Cannot slash more than total currently staked"
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
        assert.equal(fromBN(proposal.callValue), callValue, 'Expected same proposal.callValue')
        assert.equal(proposal.signature, signature, 'Expected same proposal.signature')
        assert.equal(proposal.callData, callData, 'Expected same proposal.callData')
        assert.equal(proposal.outcome, Outcome.TxFailed, 'Expected same outcome')
        assert.equal(parseInt(proposal.voteMagnitudeYes), defaultStakeAmount, 'Expected same voteMagnitudeYes')
        assert.equal(parseInt(proposal.voteMagnitudeNo), 0, 'Expected same voteMagnitudeNo')
        assert.equal(parseInt(proposal.numVotes), 1, 'Expected same numVotes')
  
        // Confirm all vote states - Vote.No for Voter, Vote.None for all others
        for (const account of accounts) {
          const voterVote = await governance.getVoteByProposalAndVoter.call(proposalId, account)
          if (account == voterAddress) {
            assert.equal(voterVote, vote)
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
            'Governance::vetoProposal:Only guardian can veto proposals'
          )
        })

        it('Ensure on active proposal can be vetoed', async () => {
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
            'Governance::vetoProposal:Cannot veto inactive proposal.'
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
            governance.evaluateProposalOutcome(proposalId, { from: proposerAddress }),
            "Governance::evaluateProposalOutcome:Cannot evaluate inactive proposal."
          )
        })
      })
    })
  })

  it('Upgrade Contract Proposal', async () => {
    // Confirm staking.newFunction() not callable before upgrade
    const stakingCopy = await StakingUpgraded.at(staking.address)
    await _lib.assertRevert(stakingCopy.newFunction.call({ from: proxyDeployerAddress }), 'revert')

    // Deploy new logic contract to later upgrade to
    const stakingUpgraded0 = await StakingUpgraded.new({ from: proxyAdminAddress })
    
    // Define vars
    const targetContractRegistryKey = stakingProxyKey
    const targetContractAddress = stakingProxy.address
    const callValue = audToWei(0)
    const signature = 'upgradeTo(address)'
    const callData = abiEncode(['address'], [stakingUpgraded0.address])
    const txHash = keccak256(
      abiEncode(
        ['address', 'uint256', 'string', 'bytes'],
        [targetContractAddress, callValue, signature, callData]
      )
    )
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
    await _lib.advanceToTargetBlock(proposalStartBlock + votingPeriod, web3)

    // Call evaluateProposalOutcome()
    const evaluateTxReceipt = await governance.evaluateProposalOutcome(proposalId, { from: proposerAddress })

    // Confirm event log states - TransactionExecuted, ProposalOutcomeEvaluated
    const [txParsedEvent0, txParsedEvent1] = _lib.parseTx(evaluateTxReceipt, true)
    assert.equal(txParsedEvent0.event.name, 'TransactionExecuted', 'Expected event.name')
    assert.equal(parseInt(txParsedEvent0.event.args.proposalId), proposalId, 'Expected event.args.proposalId')
    assert.equal(txParsedEvent0.event.args.txHash, txHash, 'Expected event.args.txHash')
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
    assert.equal(fromBN(proposal.callValue), callValue, 'Expected same proposal.callValue')
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

  describe.only('Guardian execute transactions', async () => {
    it('Fail to call from non-guardian address', async () => {
      const slashAmount = toBN(1)
      const targetAddress = stakerAccount2
      const targetContractAddress = delegateManager.address
      const callValue = toBN(0)
      const signature = 'slash(uint256,address)'
      const callData = abiEncode(['uint256', 'address'], [fromBN(slashAmount), targetAddress])

      await _lib.assertRevert(
        governance.guardianExecuteTransaction(
          targetContractAddress,
          callValue,
          signature,
          callData,
          { from: stakerAccount1 }
        ),
        "Governance::guardianExecuteTransaction:Only guardian."
      )
    })
    
    it.only('Slash staker', async () => {
      const slashAmount = toBN(1)
      const targetAddress = stakerAccount2
      const targetContractAddress = delegateManager.address
      const callValue = toBN(0)
      const signature = 'slash(uint256,address)'
      const callData = abiEncode(['uint256', 'address'], [fromBN(slashAmount), targetAddress])
      const returnData = null

      // Confirm initial Stake state
      const initialTotalStake = await staking.totalStaked()
      assert.isTrue(initialTotalStake.eq(defaultStakeAmount.mul(toBN(2))))
      const initialStakeAcct2 = await staking.totalStakedFor(targetAddress)
      assert.isTrue(initialStakeAcct2.eq(defaultStakeAmount))
      const initialTokenSupply = await token.totalSupply()

      // Execute transaction
      const guardianExecTxReceipt = await governance.guardianExecuteTransaction(
        targetContractAddress,
        callValue,
        signature,
        callData,
        { from: guardianAddress }
      )

      const guardianExecTx = _lib.parseTx(guardianExecTxReceipt)
      assert.equal(guardianExecTx.event.name, 'GuardianTransactionExecuted', 'event.name')
      assert.equal(guardianExecTx.event.args.targetContractAddress, targetContractAddress, 'event.args.targetContractAddress')
      assert.isTrue(guardianExecTx.event.args.callValue.eq(callValue), 'event.args.callValue')
      // assert.equal(guardianExecTx.event.args.signature, web3.utils.utf8ToHex(signature), 'event.args.signature')
      // assert.equal(guardianExecTx.event.args.callData, callData, 'event.args.callData')
      assert.equal(guardianExecTx.event.args.success, true, 'event.args.success')
      assert.equal(guardianExecTx.event.args.returnData, returnData, 'event.args.returnData')

      // Confirm Slash action succeeded by checking new Stake + Token values
      const finalStakeAcct2 = await staking.totalStakedFor(targetAddress)
      assert.isTrue(
        finalStakeAcct2.eq(defaultStakeAmount.sub(web3.utils.toBN(slashAmount)))
      )
      assert.isTrue(
        (initialTotalStake.sub(slashAmount)).eq(await staking.totalStaked()),
        'Expected same total stake amount'
      )
      assert.equal(
        await token.totalSupply(),
        initialTokenSupply - slashAmount,
        "Expected same token total supply"
      )
    })

    it.skip('Fail to slash too large amount', async () => {

    })

    it.skip('Upgrade contract', async () => {

    })
  })

  describe.skip('Submit proposal to upgrade governance contract', async () => {

  })
})
