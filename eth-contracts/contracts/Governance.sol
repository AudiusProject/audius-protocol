pragma solidity ^0.5.0;

import "./service/registry/RegistryContract.sol";
import "./staking/StakingInterface.sol";
import "./service/interface/registry/RegistryInterface.sol";


contract Governance is RegistryContract {
    RegistryInterface registry;
    bytes32 stakingProxyOwnerKey;

    uint256 votingPeriod;
    uint256 votingQuorum;

    /***** Enums *****/
    enum Outcome {InProgress, No, Yes, Invalid, TxFailed}
    // Enum values map to uints, so first value in Enum always is 0.
    enum Vote {None, No, Yes}

    struct Proposal {
        uint256 proposalId;
        address proposer;
        uint256 startBlockNumber;
        bytes32 targetContractRegistryKey;
        address targetContractAddress;
        uint callValue;
        string signature;
        bytes callData;
        Outcome outcome;
        uint256 voteMagnitudeYes;
        uint256 voteMagnitudeNo;
        uint256 numVotes;
        mapping(address => Vote) votes;
    }

    /***** Proposal storage *****/
    uint256 lastProposalId = 0;
    mapping(uint256 => Proposal) proposals;

    /***** Events *****/
    event ProposalSubmitted(
        uint256 indexed proposalId,
        address indexed proposer,
        uint256 startBlockNumber,
        string description
    );
    event ProposalVoteSubmitted(
        uint256 indexed proposalId,
        address indexed voter,
        Vote indexed vote,
        uint256 voterStake,
        Vote previousVote
    );
    event ProposalOutcomeEvaluated(
        uint256 indexed proposalId,
        Outcome indexed outcome,
        uint256 voteMagnitudeYes,
        uint256 voteMagnitudeNo,
        uint256 numVotes
    );
    event TransactionExecuted(
        uint256 indexed proposalId,
        bytes32 indexed txHash,
        bool indexed success,
        bytes returnData
    );

    function initialize(
        address _registryAddress,
        bytes32 _stakingProxyOwnerKey,
        uint256 _votingPeriod,
        uint256 _votingQuorum
    ) public initializer {
        require(_registryAddress != address(0x00), "Requires non-zero _registryAddress");
        registry = RegistryInterface(_registryAddress);

        stakingProxyOwnerKey = _stakingProxyOwnerKey;

        require(_votingPeriod > 0, "Requires non-zero _votingPeriod");
        votingPeriod = _votingPeriod;

        require(_votingQuorum > 0, "Requires non-zero _votingQuorum");
        votingQuorum = _votingQuorum;

        RegistryContract.initialize();
    }

    // ========================================= Governance Actions =========================================

    function submitProposal(
        bytes32 _targetContractRegistryKey,
        uint256 _callValue,
        string calldata _signature,
        bytes calldata _callData,
        string calldata _description
    ) external returns (uint256 proposalId)
    {
        requireIsInitialized();
        
        address proposer = msg.sender;

        // Require proposer is active Staker
        StakingInterface stakingContract = StakingInterface(registry.getContract(stakingProxyOwnerKey));
        require(
            stakingContract.totalStakedFor(proposer) > 0,
            "Proposer must be active staker with non-zero stake."
        );

        // Require _targetContractRegistryKey points to a valid registered contract
        address targetContractAddress = registry.getContract(_targetContractRegistryKey);
        require(
            targetContractAddress != address(0x00),
            "_targetContractRegistryKey must point to valid registered contract"
        );

        // set proposalId
        uint256 newProposalId = lastProposalId + 1;

        // Store new Proposal obj in proposals mapping
        proposals[newProposalId] = Proposal({
            proposalId: newProposalId,
            proposer: proposer,
            startBlockNumber: block.number,
            targetContractRegistryKey: _targetContractRegistryKey,
            targetContractAddress: targetContractAddress,
            callValue: _callValue,
            signature: _signature,
            callData: _callData,
            outcome: Outcome.InProgress,
            voteMagnitudeYes: 0,
            voteMagnitudeNo: 0,
            numVotes: 0
            /** votes: mappings are auto-initialized to default state */
        });

        emit ProposalSubmitted(
            newProposalId,
            proposer,
            block.number,
            _description
        );

        lastProposalId += 1;

        return newProposalId;
    }

    function submitProposalVote(uint256 _proposalId, Vote _vote) external {
        requireIsInitialized();
        
        address voter = msg.sender;

        require(
            _proposalId <= lastProposalId && _proposalId > 0,
            "Must provide valid non-zero _proposalId"
        );

        // Require voter is active Staker + get voterStake.
        StakingInterface stakingContract = StakingInterface(registry.getContract(stakingProxyOwnerKey));
        uint256 voterStake = stakingContract.totalStakedForAt(
            voter,
            proposals[_proposalId].startBlockNumber
        );
        require(voterStake > 0, "Voter must be active staker with non-zero stake.");

        // Require proposal votingPeriod is still active.
        uint256 startBlockNumber = proposals[_proposalId].startBlockNumber;
        uint256 endBlockNumber = startBlockNumber + votingPeriod;
        require(
            block.number > startBlockNumber && block.number <= endBlockNumber,
            "Proposal votingPeriod has ended"
        );

        // Require vote is not None.
        require(_vote != Vote.None, "Cannot submit None vote");

        // Record previous vote.
        Vote previousVote = proposals[_proposalId].votes[voter];

        // Will override staker's previous vote if present.
        proposals[_proposalId].votes[voter] = _vote;

        /** Update voteMagnitudes accordingly */

        // New voter (Vote enum defaults to 0)
        if (previousVote == Vote.None) {
            if (_vote == Vote.Yes) {
                proposals[_proposalId].voteMagnitudeYes += voterStake;
            } else {
                proposals[_proposalId].voteMagnitudeNo += voterStake;
            }
            proposals[_proposalId].numVotes += 1;
        } else { // Repeat voter
            if (previousVote == Vote.Yes && _vote == Vote.No) {
                proposals[_proposalId].voteMagnitudeYes -= voterStake;
                proposals[_proposalId].voteMagnitudeNo += voterStake;
            } else if (previousVote == Vote.No && _vote == Vote.Yes) {
                proposals[_proposalId].voteMagnitudeYes += voterStake;
                proposals[_proposalId].voteMagnitudeNo -= voterStake;
            }
            // If _vote == previousVote, no changes needed to vote magnitudes.
        }

        emit ProposalVoteSubmitted(
            _proposalId,
            voter,
            _vote,
            voterStake,
            previousVote
        );
    }

    function evaluateProposalOutcome(uint256 _proposalId)
    external returns (Outcome proposalOutcome)
    {
        requireIsInitialized();

        require(
            _proposalId <= lastProposalId && _proposalId > 0,
            "Must provide valid non-zero _proposalId"
        );

        // Require proposal has not already been evaluated.
        require(
            proposals[_proposalId].outcome == Outcome.InProgress,
            "Governance::evaluateProposalOutcome:Proposal has already been evaluated."
        );

        // Require msg.sender is active Staker.
        StakingInterface stakingContract = StakingInterface(registry.getContract(stakingProxyOwnerKey));
        require(
            stakingContract.totalStakedForAt(
                msg.sender, proposals[_proposalId].startBlockNumber
            ) > 0,
            "Caller must be active staker with non-zero stake."
        );

        // Require proposal votingPeriod has ended.
        uint256 startBlockNumber = proposals[_proposalId].startBlockNumber;
        uint256 endBlockNumber = startBlockNumber + votingPeriod;
        require(
            block.number > endBlockNumber,
            "Proposal votingPeriod must end before evaluation."
        );

        // Require registered contract address for provided registryKey has not changed.
        address targetContractAddress = registry.getContract(
            proposals[_proposalId].targetContractRegistryKey
        );
        require(
            targetContractAddress == proposals[_proposalId].targetContractAddress,
            "Registered contract address for targetContractRegistryKey has changed"
        );

        // Calculate outcome
        Outcome outcome;
        // votingQuorum not met -> proposal is invalid.
        if (proposals[_proposalId].numVotes < votingQuorum) {
            outcome = Outcome.Invalid;
        }
        // votingQuorum met & vote is Yes -> execute proposed transaction & close proposal.
        else if (
            proposals[_proposalId].voteMagnitudeYes >= proposals[_proposalId].voteMagnitudeNo
        ) {
            bool success = _executeTransaction(_proposalId);

            // Proposal outcome depends on success of transaction execution.
            if (success == true) {
                outcome = Outcome.Yes;
            } else {
                outcome = Outcome.TxFailed;
            }
        }
        // votingQuorum met & vote is No -> close proposal without transaction execution.
        else {
            outcome = Outcome.No;
        }

        // Record outcome
        proposals[_proposalId].outcome = outcome;

        emit ProposalOutcomeEvaluated(
            _proposalId,
            outcome,
            proposals[_proposalId].voteMagnitudeYes,
            proposals[_proposalId].voteMagnitudeNo,
            proposals[_proposalId].numVotes
        );

        return outcome;
    }

    // ========================================= Getters =========================================

    function getProposalById(uint256 _proposalId)
    external view returns (
        uint256 proposalId,
        address proposer,
        uint256 startBlockNumber,
        bytes32 targetContractRegistryKey,
        address targetContractAddress,
        uint callValue,
        string memory signature,
        bytes memory callData,
        Outcome outcome,
        uint256 voteMagnitudeYes,
        uint256 voteMagnitudeNo,
        uint256 numVotes
    )
    {
        require(
            _proposalId <= lastProposalId && _proposalId > 0,
            "Must provide valid non-zero _proposalId"
        );

        Proposal memory proposal = proposals[_proposalId];
        return (
            proposal.proposalId,
            proposal.proposer,
            proposal.startBlockNumber,
            proposal.targetContractRegistryKey,
            proposal.targetContractAddress,
            proposal.callValue,
            proposal.signature,
            proposal.callData,
            proposal.outcome,
            proposal.voteMagnitudeYes,
            proposal.voteMagnitudeNo,
            proposal.numVotes
            /** @notice - votes mapping cannot be returned by external function */
        );
    }

    function getVoteByProposalAndVoter(uint256 _proposalId, address _voter)
    external view returns (Vote vote)
    {
        require(
            _proposalId <= lastProposalId && _proposalId > 0,
            "Must provide valid non-zero _proposalId"
        );
        return proposals[_proposalId].votes[_voter];
    }

    // ========================================= Internal =========================================

    function _executeTransaction(uint256 _proposalId) internal
    returns (bool /** success */)
    {
        address targetContractAddress = proposals[_proposalId].targetContractAddress;
        uint256 callValue = proposals[_proposalId].callValue;
        string memory signature = proposals[_proposalId].signature;
        bytes memory callData = proposals[_proposalId].callData;

        bytes32 txHash = keccak256(
            abi.encode(
                targetContractAddress, callValue, signature, callData
            )
        );

        bytes memory encodedCallData;
        if (bytes(signature).length == 0) {
            encodedCallData = callData;
        } else {
            encodedCallData = abi.encodePacked(bytes4(keccak256(bytes(signature))), callData);
        }

        (bool success, bytes memory returnData) = (
            // solium-disable-next-line security/no-call-value
            targetContractAddress.call.value(callValue)(encodedCallData)
        );

        emit TransactionExecuted(
            _proposalId,
            txHash,
            success,
            returnData
        );

        return success;
    }
}