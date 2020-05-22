pragma solidity ^0.5.0;

import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "./Staking.sol";
import "./registry/Registry.sol";
import "./InitializableV2.sol";


contract Governance is InitializableV2 {
    using SafeMath for uint;

    Registry private registry;
    address stakingAddress;

    uint256 private votingPeriod;
    uint256 private votingQuorum;

    address private guardianAddress;

    /***** Enums *****/
    enum Outcome {InProgress, No, Yes, Invalid, TxFailed, Evaluating}
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
    event ProposalTransactionExecuted(
        uint256 indexed proposalId,
        bool indexed success,
        bytes returnData
    );
    event GuardianTransactionExecuted(
        address indexed targetContractAddress,
        uint256 callValue,
        string indexed signature,
        bytes indexed callData,
        bool success,
        bytes returnData
    );
    event ProposalVetoed(uint256 indexed proposalId);

    function initialize(
        address _registryAddress,
        uint256 _votingPeriod,
        uint256 _votingQuorum,
        address _guardianAddress
    ) public initializer {
        require(_registryAddress != address(0x00), "Requires non-zero _registryAddress");
        registry = Registry(_registryAddress);

        require(_votingPeriod > 0, "Requires non-zero _votingPeriod");
        votingPeriod = _votingPeriod;

        require(_votingQuorum > 0, "Requires non-zero _votingQuorum");
        votingQuorum = _votingQuorum;

        require(_guardianAddress != address(0x00), "Requires non-zero _guardianAddress");
        guardianAddress = _guardianAddress;  //Guardian address becomes the only party 

        InitializableV2.initialize();
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
        _requireIsInitialized();

        address proposer = msg.sender;

        // Require proposer is active Staker
        Staking stakingContract = Staking(stakingAddress);
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

        // Signature cannot be empty
        require(
            bytes(_signature).length != 0,
            "Governance::submitProposal: _signature cannot be empty."
        );

        // set proposalId
        uint256 newProposalId = lastProposalId.add(1);

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

        lastProposalId = lastProposalId.add(1);

        return newProposalId;
    }

    function submitProposalVote(uint256 _proposalId, Vote _vote) external {
        _requireIsInitialized();

        address voter = msg.sender;

        require(
            _proposalId <= lastProposalId && _proposalId > 0,
            "Must provide valid non-zero _proposalId"
        );

        // Require voter is active Staker + get voterStake.
        Staking stakingContract = Staking(stakingAddress);

        uint256 voterStake = stakingContract.totalStakedForAt(
            voter,
            proposals[_proposalId].startBlockNumber
        );
        require(voterStake > 0, "Voter must be active staker with non-zero stake.");

        // Require proposal is still active
        require(
            proposals[_proposalId].outcome == Outcome.InProgress,
            "Governance::submitProposalVote: Cannot vote on inactive proposal."
        );

        // Require proposal votingPeriod is still active.
        uint256 startBlockNumber = proposals[_proposalId].startBlockNumber;
        uint256 endBlockNumber = startBlockNumber.add(votingPeriod);
        require(
            block.number > startBlockNumber && block.number <= endBlockNumber,
            "Governance::submitProposalVote: Proposal votingPeriod has ended"
        );

        // Require vote is either Yes or No
        require(_vote == Vote.Yes || _vote == Vote.No, "Governance::submitProposalVote: Can only submit a Yes or No vote");

        // Record previous vote.
        Vote previousVote = proposals[_proposalId].votes[voter];

        // Will override staker's previous vote if present.
        proposals[_proposalId].votes[voter] = _vote;

        /** Update voteMagnitudes accordingly */

        // New voter (Vote enum defaults to 0)
        if (previousVote == Vote.None) {
            if (_vote == Vote.Yes) {
                proposals[_proposalId].voteMagnitudeYes = (
                    proposals[_proposalId].voteMagnitudeYes.add(voterStake)
                );
            } else {
                proposals[_proposalId].voteMagnitudeNo = (
                    proposals[_proposalId].voteMagnitudeNo.add(voterStake)
                );
            }
            proposals[_proposalId].numVotes = proposals[_proposalId].numVotes.add(1);
        } else { // Repeat voter
            if (previousVote == Vote.Yes && _vote == Vote.No) {
                proposals[_proposalId].voteMagnitudeYes = (
                    proposals[_proposalId].voteMagnitudeYes.sub(voterStake)
                );
                proposals[_proposalId].voteMagnitudeNo = (
                    proposals[_proposalId].voteMagnitudeNo.add(voterStake)
                );
            } else if (previousVote == Vote.No && _vote == Vote.Yes) {
                proposals[_proposalId].voteMagnitudeYes = (
                    proposals[_proposalId].voteMagnitudeYes.add(voterStake)
                );
                proposals[_proposalId].voteMagnitudeNo = (
                    proposals[_proposalId].voteMagnitudeNo.sub(voterStake)
                );
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
        _requireIsInitialized();

        require(
            _proposalId <= lastProposalId && _proposalId > 0,
            "Governance::evaluateProposalOutcome: Must provide valid non-zero _proposalId."
        );

        // Require proposal has not already been evaluated.
        require(
            proposals[_proposalId].outcome == Outcome.InProgress,
            "Governance::evaluateProposalOutcome: Cannot evaluate inactive proposal."
        );

        /// Re-entrancy should not be possible here since this switches the status of the
        /// proposal to 'Evaluating' so it should fail the status is 'InProgress' check
        proposals[_proposalId].outcome = Outcome.Evaluating;

        // Require msg.sender is active Staker.
        Staking stakingContract = Staking(stakingAddress);

        require(
            stakingContract.totalStakedForAt(
                msg.sender, proposals[_proposalId].startBlockNumber
            ) > 0,
            "Governance::evaluateProposalOutcome: Caller must be active staker with non-zero stake."
        );

        // Require proposal votingPeriod has ended.
        uint256 startBlockNumber = proposals[_proposalId].startBlockNumber;
        uint256 endBlockNumber = startBlockNumber.add(votingPeriod);
        require(
            block.number > endBlockNumber,
            "Governance::evaluateProposalOutcome: Proposal votingPeriod must end before evaluation."
        );

        // Require registered contract address for provided registryKey has not changed.
        address targetContractAddress = registry.getContract(
            proposals[_proposalId].targetContractRegistryKey
        );
        require(
            targetContractAddress == proposals[_proposalId].targetContractAddress,
            "Governance::evaluateProposalOutcome: Registered contract address for targetContractRegistryKey has changed"
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
            (bool success, bytes memory returnData) = _executeTransaction(
                targetContractAddress,
                proposals[_proposalId].callValue,
                proposals[_proposalId].signature,
                proposals[_proposalId].callData
            );

            emit ProposalTransactionExecuted(
                _proposalId,
                success,
                returnData
            );

            // Proposal outcome depends on success of transaction execution.
            if (success) {
                outcome = Outcome.Yes;
            } else {
                outcome = Outcome.TxFailed;
            }
        }
        // votingQuorum met & vote is No -> close proposal without transaction execution.
        else {
            outcome = Outcome.No;
        }

        /// This records the final outcome in the proposals mapping
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

    function vetoProposal(uint256 _proposalId) external {
        _requireIsInitialized();

        require(
            msg.sender == guardianAddress,
            "Governance::vetoProposal: Only guardian can veto proposals."
        );

        require(
            _proposalId <= lastProposalId && _proposalId > 0,
            "Governance::vetoProposal: Must provide valid non-zero _proposalId."
        );

        require(
            proposals[_proposalId].outcome == Outcome.InProgress,
            "Governance::vetoProposal: Cannot veto inactive proposal."
        );

        proposals[_proposalId].outcome = Outcome.No;

        emit ProposalVetoed(_proposalId);
    }

    // ========================================= Config Setters =========================================

    // Set staking owner address
    function setStakingAddress(address _address) external {
        require(msg.sender == address(this), "Only callable by self");
        stakingAddress = _address;
    }

    // Set votingPeriod
    function setVotingPeriod(uint256 _votingPeriod) external {
        require(msg.sender == address(this), "Only callable by self");
        votingPeriod = _votingPeriod;
    }

    // Set votingQuorum
    function setVotingQuorum(uint256 _votingQuorum) external {
        require(msg.sender == address(this), "Only callable by self");
        votingQuorum = _votingQuorum;
    }

    // ========================================= Guardian Actions =========================================

    function guardianExecuteTransaction(
        bytes32 _targetContractRegistryKey,
        uint256 _callValue,
        string calldata _signature,
        bytes calldata _callData
    ) external
    {
        _requireIsInitialized();

        require(
            msg.sender == guardianAddress,
            "Governance::guardianExecuteTransaction: Only guardian."
        );

        // Require _targetContractRegistryKey points to a valid registered contract
        address targetContractAddress = registry.getContract(_targetContractRegistryKey);
        require(
            targetContractAddress != address(0x00),
            "Governance::guardianExecuteTransaction: _targetContractRegistryKey must point to valid registered contract"
        );

        // Signature cannot be empty
        require(
            bytes(_signature).length != 0,
            "Governance::guardianExecuteTransaction: _signature cannot be empty."
        );

        (bool success, bytes memory returnData) = _executeTransaction(
            targetContractAddress,
            _callValue,
            _signature,
            _callData
        );

        emit GuardianTransactionExecuted(
            targetContractAddress,
            _callValue,
            _signature,
            _callData,
            success,
            returnData
        );
    }

    function guardianExecuteTransactionOnAddress(
        address _targetContractAddress,
        uint256 _callValue,
        string calldata _signature,
        bytes calldata _callData
    ) external
    {
        _requireIsInitialized();

        require(
            msg.sender == guardianAddress,
            "Governance::guardianExecuteTransactionOnAddress: Only guardian."
        );

        require(
            _targetContractAddress != address(0x00),
            "Governance::guardianExecuteTransactionOnAddress: _targetContractRegistryKey must point to valid registered contract"
        );

        // Signature cannot be empty
        require(
            bytes(_signature).length != 0,
            "Governance::guardianExecuteTransactionOnAddress: _signature cannot be empty."
        );

        (bool success, bytes memory returnData) = _executeTransaction(
            _targetContractAddress,
            _callValue,
            _signature,
            _callData
        );

        emit GuardianTransactionExecuted(
            _targetContractAddress,
            _callValue,
            _signature,
            _callData,
            success,
            returnData
        );
    }

    function transferGuardianship(address _newGuardianAddress) external {
        _requireIsInitialized();

        require(
            msg.sender == guardianAddress,
            "Governance::guardianExecuteTransaction: Only guardian."
        );

        // TODO - ensure _newGuardianAddress is not a contract (maybe not possible?)

        guardianAddress = _newGuardianAddress;
    }

    // ========================================= Getter Functions =========================================

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

    function getGuardianAddress() external view returns (address) {
        _requireIsInitialized();

        return guardianAddress;
    }

    function getStakingAddress() external view returns (address) {
        return stakingAddress;
    }

    function getVotingPeriod() external view returns (uint) {
        _requireIsInitialized();

        return votingPeriod;
    }

    function getVotingQuorum() external view returns (uint) {
        _requireIsInitialized();

        return votingQuorum;
    }

    // ========================================= Internal Functions =========================================
    /**
     * @notice Execute a transaction attached to a governanace proposal
     * @dev We are aware of both potential re-entrancy issues and the risks associated with low-level solidity
     *      function calls here, but have chosen to keep this code with those issues in mind. All governance
     *      proposals go through a voting process, and all will be reviewed carefully to ensure that they
     *      adhere to the expected behaviors of this call - but adding restrictions here would limit the ability
     *      of the governance system to do required work in a generic way.
     */
    function _executeTransaction(
        address _targetContractAddress,
        uint256 _callValue,
        string memory _signature,
        bytes memory _callData
    ) internal returns (bool /** success */, bytes memory /** returnData */)
    {
        bytes memory encodedCallData = abi.encodePacked(
            bytes4(keccak256(bytes(_signature))),
            _callData
        );
        (bool success, bytes memory returnData) = (
            // solium-disable-next-line security/no-call-value
            _targetContractAddress.call.value(_callValue)(encodedCallData)
        );

        return (success, returnData);
    }
}
