pragma solidity ^0.5.0;

import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "./Staking.sol";
import "./registry/Registry.sol";
import "./InitializableV2.sol";


contract Governance is InitializableV2 {
    using SafeMath for uint256;

    string private constant ERROR_INVALID_PROPOSAL = (
        "Governance: Must provide valid non-zero _proposalId"
    );
    string private constant ERROR_ONLY_GOVERNANCE = (
        "Governance: Only callable by self"
    );
    string private constant ERROR_INVALID_VOTING_PERIOD = (
        "Governance: Requires non-zero _votingPeriod"
    );
    string private constant ERROR_INVALID_REGISTRY = (
        "Governance: Requires non-zero _registryAddress"
    );
    string private constant ERROR_INVALID_VOTING_QUORUM = (
        "Governance: Requires _votingQuorumPercent between 1 & 100"
    );

    /**
     * @notice Address and contract instance of Audius Registry. Used to ensure this contract
     *      can only govern contracts that are registered in the Audius Registry.
     */
    Registry private registry;

    /// @notice Address of Audius staking contract, used to permission Governance method calls
    address private stakingAddress;

    /// @notice Address of Audius ServiceProvider contract, used to permission Governance method calls
    address private serviceProviderFactoryAddress;

    /// @notice Address of Audius DelegateManager contract, used to permission Governance method calls
    address private delegateManagerAddress;

    /// @notice Period in blocks for which a governance proposal is open for voting
    uint256 private votingPeriod;

    /// @notice Number of blocks that must pass after votingPeriod has expired before proposal can be evaluated/executed
    uint256 private executionDelay;

    /// @notice Required minimum percentage of total stake to have voted to consider a proposal valid
    ///         Percentaged stored as a uint256 between 0 & 100
    ///         Calculated as: 100 * sum of voter stakes / total staked in Staking (at proposal submission block)
    uint256 private votingQuorumPercent;

    /// @notice Max number of InProgress proposals possible at once
    /// @dev uint16 gives max possible value of 65,535
    uint16 private maxInProgressProposals;

    /**
     * @notice Address of account that has special Governance permissions. Can veto proposals
     *      and execute transactions directly on contracts.
     */
    address private guardianAddress;

    /***** Enums *****/

    /**
     * @notice All Proposal Outcome states.
     *      InProgress - Proposal is active and can be voted on.
     *      Rejected - Proposal votingPeriod has closed and vote failed to pass. Proposal will not be executed.
     *      ApprovedExecuted - Proposal votingPeriod has closed and vote passed. Proposal was successfully executed.
     *      QuorumNotMet - Proposal votingPeriod has closed and votingQuorumPercent was not met. Proposal will not be executed.
     *      ApprovedExecutionFailed - Proposal vote passed, but transaction execution failed.
     *      Evaluating - Proposal vote passed, and evaluateProposalOutcome function is currently running.
     *          This status is transiently used inside that function to prevent re-entrancy.
     *      Vetoed - Proposal was vetoed by Guardian.
     *      TargetContractAddressChanged - Proposal considered invalid since target contract address changed
     *      TargetContractCodeHashChanged - Proposal considered invalid since code has at target contract address has changed
     */
    enum Outcome {
        InProgress,
        Rejected,
        ApprovedExecuted,
        QuorumNotMet,
        ApprovedExecutionFailed,
        Evaluating,
        Vetoed,
        TargetContractAddressChanged,
        TargetContractCodeHashChanged
    }

    /**
     * @notice All Proposal Vote states for a voter.
     *      None - The default state, for any account that has not previously voted on this Proposal.
     *      No - The account voted No on this Proposal.
     *      Yes - The account voted Yes on this Proposal.
     * @dev Enum values map to uints, so first value in Enum always is 0.
     */
    enum Vote {None, No, Yes}

    struct Proposal {
        uint256 proposalId;
        address proposer;
        uint256 submissionBlockNumber;
        bytes32 targetContractRegistryKey;
        address targetContractAddress;
        uint256 callValue;
        string functionSignature;
        bytes callData;
        Outcome outcome;
        uint256 voteMagnitudeYes;
        uint256 voteMagnitudeNo;
        uint256 numVotes;
        mapping(address => Vote) votes;
        mapping(address => uint256) voteMagnitude;
        bytes32 contractHash;
    }

    /***** Proposal storage *****/

    /// @notice ID of most recently created proposal. Ids are monotonically increasing and 1-indexed.
    uint256 lastProposalId = 0;

    /// @notice mapping of proposalId to Proposal struct with all proposal state
    mapping(uint256 => Proposal) proposals;

    /// @notice array of proposals with InProgress state
    uint256[] inProgressProposals;


    /***** Events *****/
    event ProposalSubmitted(
        uint256 indexed proposalId,
        address indexed proposer,
        string name,
        string description
    );
    event ProposalVoteSubmitted(
        uint256 indexed proposalId,
        address indexed voter,
        Vote indexed vote,
        uint256 voterStake
    );
    event ProposalVoteUpdated(
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
        string indexed functionSignature,
        bytes indexed callData,
        bytes returnData
    );
    event ProposalVetoed(uint256 indexed proposalId);
    event RegistryAddressUpdated(address indexed newRegistryAddress);
    event GuardianshipTransferred(address indexed newGuardianAddress);

    /**
     * @notice Initialize the Governance contract
     * @dev _votingPeriod <= DelegateManager.undelegateLockupDuration
     * @dev stakingAddress must be initialized separately after Staking contract is deployed
     * @param _registryAddress - address of the registry proxy contract
     * @param _votingPeriod - period in blocks for which a governance proposal is open for voting
     * @param _executionDelay - number of blocks that must pass after votingPeriod has expired before proposal can be evaluated/executed
     * @param _votingQuorumPercent - required minimum percentage of total stake to have voted to consider a proposal valid
     * @param _maxInProgressProposals - max number of InProgress proposals possible at once
     * @param _guardianAddress - address of account that has special Governance permissions
     */
    function initialize(
        address _registryAddress,
        uint256 _votingPeriod,
        uint256 _executionDelay,
        uint256 _votingQuorumPercent,
        uint16 _maxInProgressProposals,
        address _guardianAddress
    ) public initializer {
        require(_registryAddress != address(0x00), ERROR_INVALID_REGISTRY);
        registry = Registry(_registryAddress);

        require(_votingPeriod > 0, ERROR_INVALID_VOTING_PERIOD);
        votingPeriod = _votingPeriod;

        // executionDelay does not have to be non-zero
        executionDelay = _executionDelay;

        require(
            _maxInProgressProposals > 0,
            "Governance: Requires non-zero _maxInProgressProposals"
        );
        maxInProgressProposals = _maxInProgressProposals;

        require(
            _votingQuorumPercent > 0 && _votingQuorumPercent <= 100,
            ERROR_INVALID_VOTING_QUORUM
        );
        votingQuorumPercent = _votingQuorumPercent;

        require(
            _guardianAddress != address(0x00),
            "Governance: Requires non-zero _guardianAddress"
        );
        guardianAddress = _guardianAddress;  //Guardian address becomes the only party

        InitializableV2.initialize();
    }

    // ========================================= Governance Actions =========================================

    /**
     * @notice Submit a proposal for vote. Only callable by stakers with non-zero stake.
     *
     * @dev _name and _description length is not enforced since they aren't stored on-chain and only event emitted
     *
     * @param _targetContractRegistryKey - Registry key for the contract concerning this proposal
     * @param _callValue - amount of wei to pass with function call if a token transfer is involved
     * @param _functionSignature - function signature of the function to be executed if proposal is successful
     * @param _callData - encoded value(s) to call function with if proposal is successful
     * @param _name - Text name of proposal to be emitted in event
     * @param _description - Text description of proposal to be emitted in event
     * @return - ID of new proposal
     */
    function submitProposal(
        bytes32 _targetContractRegistryKey,
        uint256 _callValue,
        string calldata _functionSignature,
        bytes calldata _callData,
        string calldata _name,
        string calldata _description
    ) external returns (uint256)
    {
        _requireIsInitialized();
        _requireStakingAddressIsSet();
        _requireServiceProviderFactoryAddressIsSet();
        _requireDelegateManagerAddressIsSet();

        address proposer = msg.sender;

        // Require all InProgress proposals that can be evaluated have been evaluated before new proposal submission
        require(
            this.inProgressProposalsAreUpToDate(),
            "Governance: Cannot submit new proposal until all evaluatable InProgress proposals are evaluated."
        );

        // Require new proposal submission would not push number of InProgress proposals over max number
        require(
            inProgressProposals.length < maxInProgressProposals,
            "Governance: Number of InProgress proposals already at max. Please evaluate if possible, or wait for current proposals' votingPeriods to expire."
        );

        // Require proposer is active Staker or guardian address
        require(
            Staking(stakingAddress).isStaker(proposer) || proposer == guardianAddress,
            "Governance: Proposer must be active staker with non-zero stake or guardianAddress."
        );

        // Require _targetContractRegistryKey points to a valid registered contract
        address targetContractAddress = registry.getContract(_targetContractRegistryKey);
        require(
            targetContractAddress != address(0x00),
            "Governance: _targetContractRegistryKey must point to valid registered contract"
        );

        // Signature cannot be empty
        require(
            bytes(_functionSignature).length != 0,
            "Governance: _functionSignature cannot be empty."
        );

        // Require non-zero description length
        require(bytes(_description).length > 0, "Governance: _description length must be > 0");

        // Require non-zero name length
        require(bytes(_name).length > 0, "Governance: _name length must be > 0");


        // set proposalId
        uint256 newProposalId = lastProposalId.add(1);

        // Store new Proposal obj in proposals mapping
        proposals[newProposalId] = Proposal({
            proposalId: newProposalId,
            proposer: proposer,
            submissionBlockNumber: block.number,
            targetContractRegistryKey: _targetContractRegistryKey,
            targetContractAddress: targetContractAddress,
            callValue: _callValue,
            functionSignature: _functionSignature,
            callData: _callData,
            outcome: Outcome.InProgress,
            voteMagnitudeYes: 0,
            voteMagnitudeNo: 0,
            numVotes: 0,
            contractHash: _getCodeHash(targetContractAddress)
            /* votes: mappings are auto-initialized to default state */
        });

        // Append new proposalId to inProgressProposals array
        inProgressProposals.push(newProposalId);

        emit ProposalSubmitted(
            newProposalId,
            proposer,
            _name,
            _description
        );

        lastProposalId = newProposalId;

        return newProposalId;
    }

    /**
     * @notice Vote on an active Proposal. Only callable by stakers with non-zero stake.
     * @param _proposalId - id of the proposal this vote is for
     * @param _vote - can be either {Yes, No} from Vote enum. No other values allowed
     */
    function submitVote(uint256 _proposalId, Vote _vote) external {
        _requireIsInitialized();
        _requireStakingAddressIsSet();
        _requireServiceProviderFactoryAddressIsSet();
        _requireDelegateManagerAddressIsSet();

        address voter = msg.sender;

        // Validates new _vote, _proposalId, proposal state, and voter state + returns voterStake
        uint256 voterStake = _validateVoteAndGetVoterStake(voter, _proposalId, _vote);

        // Ensure previous vote is None
        require(
            proposals[_proposalId].votes[voter] == Vote.None,
            "Governance: To update previous vote, call updateVote()"
        );

        // Record vote
        proposals[_proposalId].votes[voter] = _vote;

        // Update stored weight
        proposals[_proposalId].voteMagnitude[voter] = voterStake;

        // Update vote magnitudes
        if (_vote == Vote.Yes) {
            _increaseVoteMagnitudeYes(_proposalId, voterStake);
        } else {
            _increaseVoteMagnitudeNo(_proposalId, voterStake);
        }

        // Update numVotes
        proposals[_proposalId].numVotes = proposals[_proposalId].numVotes.add(1);

        emit ProposalVoteSubmitted(
            _proposalId,
            voter,
            _vote,
            voterStake
        );
    }

    /**
     * @notice Update previous vote on an active Proposal. Only callable by stakers with non-zero stake.
     * @param _proposalId - id of the proposal this vote is for
     * @param _vote - can be either {Yes, No} from Vote enum. No other values allowed
     */
    function updateVote(uint256 _proposalId, Vote _vote) external {
        _requireIsInitialized();
        _requireStakingAddressIsSet();
        _requireServiceProviderFactoryAddressIsSet();
        _requireDelegateManagerAddressIsSet();

        address voter = msg.sender;

        // Record previous vote
        Vote previousVote = proposals[_proposalId].votes[voter];

        // Ensure previous vote is not None
        require(
            previousVote != Vote.None,
            "Governance: To submit new vote, call submitVote()"
        );

        // Validates new _vote, _proposalId, proposal state, and voter state + returns voterStake
        uint256 voterStake = proposals[_proposalId].voteMagnitude[voter];

        // Override previous vote
        proposals[_proposalId].votes[voter] = _vote;

        // Update vote magnitudes
        if (previousVote == Vote.Yes && _vote == Vote.No) {
            _decreaseVoteMagnitudeYes(_proposalId, voterStake);
            _increaseVoteMagnitudeNo(_proposalId, voterStake);
        } else if (previousVote == Vote.No && _vote == Vote.Yes) {
            _decreaseVoteMagnitudeNo(_proposalId, voterStake);
            _increaseVoteMagnitudeYes(_proposalId, voterStake);
        }
        // If _vote == previousVote, no changes needed to vote magnitudes.

        // Do not update numVotes

        emit ProposalVoteUpdated(
            _proposalId,
            voter,
            _vote,
            voterStake,
            previousVote
        );
    }

    /**
     * @notice Once the voting period + executionDelay for a proposal has ended, evaluate the outcome and
     *      execute the proposal if voting quorum met & vote passes.
     *      To pass, stake-weighted vote must be > 50% Yes.
     * @dev Requires that caller is an active staker at the time the proposal is created
     * @param _proposalId - id of the proposal
     * @return Outcome of proposal evaluation
     */
    function evaluateProposalOutcome(uint256 _proposalId)
    external returns (Outcome)
    {
        _requireIsInitialized();
        _requireStakingAddressIsSet();
        _requireServiceProviderFactoryAddressIsSet();
        _requireDelegateManagerAddressIsSet();

        require(
            _proposalId <= lastProposalId && _proposalId > 0,
            ERROR_INVALID_PROPOSAL
        );

        // Require proposal has not already been evaluated.
        require(
            proposals[_proposalId].outcome == Outcome.InProgress,
            "Governance: Can only evaluate InProgress proposal."
        );

        // Re-entrancy should not be possible here since this switches the status of the
        // proposal to 'Evaluating' so it should fail the status is 'InProgress' check
        proposals[_proposalId].outcome = Outcome.Evaluating;

        // Require proposal votingPeriod + executionDelay have ended.
        uint256 submissionBlockNumber = proposals[_proposalId].submissionBlockNumber;
        uint256 endBlockNumber = submissionBlockNumber.add(votingPeriod).add(executionDelay);
        require(
            block.number > endBlockNumber,
            "Governance: Proposal votingPeriod & executionDelay must end before evaluation."
        );

        address targetContractAddress = registry.getContract(
            proposals[_proposalId].targetContractRegistryKey
        );

        Outcome outcome;

        // target contract address changed -> close proposal without execution.
        if (targetContractAddress != proposals[_proposalId].targetContractAddress) {
            outcome = Outcome.TargetContractAddressChanged;
        }
        else if (_getCodeHash(targetContractAddress) != proposals[_proposalId].contractHash) {
            outcome = Outcome.TargetContractCodeHashChanged;
        }
        // voting quorum not met -> close proposal without execution.
        else if (_quorumMet(proposals[_proposalId], Staking(stakingAddress)) == false) {
            outcome = Outcome.QuorumNotMet;
        }
        // votingQuorumPercent met & vote passed -> execute proposed transaction & close proposal.
        else if (
            proposals[_proposalId].voteMagnitudeYes > proposals[_proposalId].voteMagnitudeNo
        ) {
            (bool success, bytes memory returnData) = _executeTransaction(
                targetContractAddress,
                proposals[_proposalId].callValue,
                proposals[_proposalId].functionSignature,
                proposals[_proposalId].callData
            );

            emit ProposalTransactionExecuted(
                _proposalId,
                success,
                returnData
            );

            // Proposal outcome depends on success of transaction execution.
            if (success) {
                outcome = Outcome.ApprovedExecuted;
            } else {
                outcome = Outcome.ApprovedExecutionFailed;
            }
        }
        // votingQuorumPercent met & vote did not pass -> close proposal without transaction execution.
        else {
            outcome = Outcome.Rejected;
        }

        // This records the final outcome in the proposals mapping
        proposals[_proposalId].outcome = outcome;

        // Remove from inProgressProposals array
        _removeFromInProgressProposals(_proposalId);

        emit ProposalOutcomeEvaluated(
            _proposalId,
            outcome,
            proposals[_proposalId].voteMagnitudeYes,
            proposals[_proposalId].voteMagnitudeNo,
            proposals[_proposalId].numVotes
        );

        return outcome;
    }

    /**
     * @notice Action limited to the guardian address that can veto a proposal
     * @param _proposalId - id of the proposal
     */
    function vetoProposal(uint256 _proposalId) external {
        _requireIsInitialized();

        require(
            msg.sender == guardianAddress,
            "Governance: Only guardian can veto proposals."
        );

        require(
            _proposalId <= lastProposalId && _proposalId > 0,
            "Governance: Must provide valid non-zero _proposalId."
        );

        require(
            proposals[_proposalId].outcome == Outcome.InProgress,
            "Governance: Cannot veto inactive proposal."
        );

        proposals[_proposalId].outcome = Outcome.Vetoed;

        // Remove from inProgressProposals array
        _removeFromInProgressProposals(_proposalId);

        emit ProposalVetoed(_proposalId);
    }

    // ========================================= Config Setters =========================================

    /**
     * @notice Set the Staking address
     * @dev Only callable by self via _executeTransaction
     * @param _stakingAddress - address for new Staking contract
     */
    function setStakingAddress(address _stakingAddress) external {
        _requireIsInitialized();

        require(msg.sender == address(this), ERROR_ONLY_GOVERNANCE);
        require(_stakingAddress != address(0x00), "Governance: Requires non-zero _stakingAddress");
        stakingAddress = _stakingAddress;
    }

    /**
     * @notice Set the ServiceProviderFactory address
     * @dev Only callable by self via _executeTransaction
     * @param _serviceProviderFactoryAddress - address for new Staking contract
     */
    function setServiceProviderFactoryAddress(address _serviceProviderFactoryAddress) external {
        _requireIsInitialized();

        require(msg.sender == address(this), ERROR_ONLY_GOVERNANCE);
        require(_serviceProviderFactoryAddress != address(0x00), "Governance: Requires non-zero _serviceProviderFactoryAddress");
        serviceProviderFactoryAddress = _serviceProviderFactoryAddress;
    }

    /**
     * @notice Set the DelegateManager address
     * @dev Only callable by self via _executeTransaction
     * @param _delegateManagerAddress - address for new DelegateManager contract
     */
    function setDelegateManagerAddress(address _delegateManagerAddress) external {
        _requireIsInitialized();

        require(msg.sender == address(this), ERROR_ONLY_GOVERNANCE);
        require(_delegateManagerAddress != address(0x00), "Governance: Requires non-zero _delegateManagerAddress");
        delegateManagerAddress = _delegateManagerAddress;
    }

    /**
     * @notice Set the voting period for a Governance proposal
     * @dev Only callable by self via _executeTransaction
     * @param _votingPeriod - new voting period
     */
    function setVotingPeriod(uint256 _votingPeriod) external {
        _requireIsInitialized();

        require(msg.sender == address(this), ERROR_ONLY_GOVERNANCE);
        require(_votingPeriod > 0, ERROR_INVALID_VOTING_PERIOD);
        votingPeriod = _votingPeriod;
    }

    /**
     * @notice Set the voting quorum percentage for a Governance proposal
     * @dev Only callable by self via _executeTransaction
     * @param _votingQuorumPercent - new voting period
     */
    function setVotingQuorumPercent(uint256 _votingQuorumPercent) external {
        _requireIsInitialized();

        require(msg.sender == address(this), ERROR_ONLY_GOVERNANCE);
        require(
            _votingQuorumPercent > 0 && _votingQuorumPercent <= 100,
            ERROR_INVALID_VOTING_QUORUM
        );
        votingQuorumPercent = _votingQuorumPercent;
    }

    /**
     * @notice Set the Registry address
     * @dev Only callable by self via _executeTransaction
     * @param _registryAddress - address for new Registry contract
     */
    function setRegistryAddress(address _registryAddress) external {
        _requireIsInitialized();

        require(msg.sender == address(this), ERROR_ONLY_GOVERNANCE);
        require(_registryAddress != address(0x00), ERROR_INVALID_REGISTRY);

        registry = Registry(_registryAddress);

        emit RegistryAddressUpdated(_registryAddress);
    }

    /**
     * @notice Set the max number of concurrent InProgress proposals
     * @dev Only callable by self via _executeTransaction
     * @param _newMaxInProgressProposals - new value for maxInProgressProposals
     */
    function setMaxInProgressProposals(uint16 _newMaxInProgressProposals) external {
        _requireIsInitialized();

        require(msg.sender == address(this), ERROR_ONLY_GOVERNANCE);
        require(
            _newMaxInProgressProposals > 0,
            "Governance: Requires non-zero _newMaxInProgressProposals"
        );
        maxInProgressProposals = _newMaxInProgressProposals;
    }

    /**
     * @notice Set the execution delay for a proposal
     * @dev Only callable by self via _executeTransaction
     * @param _newExecutionDelay - new value for executionDelay
     */
    function setExecutionDelay(uint256 _newExecutionDelay) external {
        _requireIsInitialized();

        require(msg.sender == address(this), ERROR_ONLY_GOVERNANCE);
        // executionDelay does not have to be non-zero
        executionDelay = _newExecutionDelay;
    }

    // ========================================= Guardian Actions =========================================

    /**
     * @notice Allows the guardianAddress to execute protocol actions
     * @param _targetContractRegistryKey - key in registry of target contract
     * @param _callValue - amount of wei if a token transfer is involved
     * @param _functionSignature - function signature of the function to be executed if proposal is successful
     * @param _callData - encoded value(s) to call function with if proposal is successful
     */
    function guardianExecuteTransaction(
        bytes32 _targetContractRegistryKey,
        uint256 _callValue,
        string calldata _functionSignature,
        bytes calldata _callData
    ) external
    {
        _requireIsInitialized();

        require(
            msg.sender == guardianAddress,
            "Governance: Only guardian."
        );

        // _targetContractRegistryKey must point to a valid registered contract
        address targetContractAddress = registry.getContract(_targetContractRegistryKey);
        require(
            targetContractAddress != address(0x00),
            "Governance: _targetContractRegistryKey must point to valid registered contract"
        );

        // Signature cannot be empty
        require(
            bytes(_functionSignature).length != 0,
            "Governance: _functionSignature cannot be empty."
        );

        (bool success, bytes memory returnData) = _executeTransaction(
            targetContractAddress,
            _callValue,
            _functionSignature,
            _callData
        );

        require(success, "Governance: Transaction failed.");

        emit GuardianTransactionExecuted(
            targetContractAddress,
            _callValue,
            _functionSignature,
            _callData,
            returnData
        );
    }

    /**
     * @notice Change the guardian address
     * @dev Only callable by current guardian
     * @param _newGuardianAddress - new guardian address
     */
    function transferGuardianship(address _newGuardianAddress) external {
        _requireIsInitialized();

        require(
            msg.sender == guardianAddress,
            "Governance: Only guardian."
        );

        guardianAddress = _newGuardianAddress;

        emit GuardianshipTransferred(_newGuardianAddress);
    }

    // ========================================= Getter Functions =========================================

    /**
     * @notice Get proposal information by proposal Id
     * @param _proposalId - id of proposal
     */
    function getProposalById(uint256 _proposalId)
    external view returns (
        uint256 proposalId,
        address proposer,
        uint256 submissionBlockNumber,
        bytes32 targetContractRegistryKey,
        address targetContractAddress,
        uint256 callValue,
        string memory functionSignature,
        bytes memory callData,
        Outcome outcome,
        uint256 voteMagnitudeYes,
        uint256 voteMagnitudeNo,
        uint256 numVotes
    )
    {
        _requireIsInitialized();

        // TODO: Move error to string
        require(
            _proposalId <= lastProposalId && _proposalId > 0,
            "Governance: Must provide valid non-zero _proposalId"
        );

        Proposal memory proposal = proposals[_proposalId];
        return (
            proposal.proposalId,
            proposal.proposer,
            proposal.submissionBlockNumber,
            proposal.targetContractRegistryKey,
            proposal.targetContractAddress,
            proposal.callValue,
            proposal.functionSignature,
            proposal.callData,
            proposal.outcome,
            proposal.voteMagnitudeYes,
            proposal.voteMagnitudeNo,
            proposal.numVotes
            /** @notice - votes mapping cannot be returned by external function */
        );
    }

    /**
     * @notice Get proposal target contract hash by proposalId
     * @dev This is a separate function because the getProposalById returns too many
            variables already and by adding more, you get the error
            `InternalCompilerError: Stack too deep, try using fewer variables`
     * @param _proposalId - id of proposal
     */
    function getProposalTargetContractHash(uint256 _proposalId)
    external view returns (bytes32)
    {
        _requireIsInitialized();

        require(
            _proposalId <= lastProposalId && _proposalId > 0,
            "Governance: Must provide valid non-zero _proposalId"
        );

        return (proposals[_proposalId].contractHash);
    }

    /**
     * @notice Get how a voter voted for a given proposal
     * @param _proposalId - id of the proposal
     * @param _voter - address of the voter we want to check
     * @return returns a value from the Vote enum if a valid vote, otherwise returns no value
     */
    function getVoteByProposalAndVoter(uint256 _proposalId, address _voter)
    external view returns (Vote)
    {
        _requireIsInitialized();

        // TODO: Move error to string
        require(
            _proposalId <= lastProposalId && _proposalId > 0,
            "Governance: Must provide valid non-zero _proposalId"
        );
        return proposals[_proposalId].votes[_voter];
    }

    /// @notice Get the contract Guardian address
    function getGuardianAddress() external view returns (address) {
        _requireIsInitialized();

        return guardianAddress;
    }

    /// @notice Get the Staking address
    function getStakingAddress() external view returns (address) {
        _requireIsInitialized();

        return stakingAddress;
    }

    /// @notice Get the ServiceProviderFactory address
    function getServiceProviderFactoryAddress() external view returns (address) {
        _requireIsInitialized();

        return serviceProviderFactoryAddress;
    }

    /// @notice Get the DelegateManager address
    function getDelegateManagerAddress() external view returns (address) {
        _requireIsInitialized();

        return delegateManagerAddress;
    }

    /// @notice Get the contract voting period
    function getVotingPeriod() external view returns (uint256) {
        _requireIsInitialized();

        return votingPeriod;
    }

    /// @notice Get the contract voting quorum percent
    function getVotingQuorumPercent() external view returns (uint256) {
        _requireIsInitialized();

        return votingQuorumPercent;
    }

    /// @notice Get the registry address
    function getRegistryAddress() external view returns (address) {
        _requireIsInitialized();

        return address(registry);
    }

    /// @notice Used to check if is governance contract before setting governance address in other contracts
    function isGovernanceAddress() external pure returns (bool) {
        return true;
    }

    /// @notice Get the max number of concurrent InProgress proposals
    function getMaxInProgressProposals() external view returns (uint16) {
        _requireIsInitialized();

        return maxInProgressProposals;
    }

    /// @notice Get the proposal execution delay
    function getExecutionDelay() external view returns (uint256) {
        _requireIsInitialized();

        return executionDelay;
    }

    /// @notice Get the array of all InProgress proposal Ids
    function getInProgressProposals() external view returns (uint256[] memory) {
        _requireIsInitialized();

        return inProgressProposals;
    }

    /**
     * @notice Returns false if any proposals in inProgressProposals array are evaluatable
     *          Evaluatable = proposals with closed votingPeriod
     * @dev Is public since its called internally in `submitProposal()` as well as externally in UI
     */
    function inProgressProposalsAreUpToDate() external view returns (bool) {
        _requireIsInitialized();

        // compare current block number against endBlockNumber of each proposal
        for (uint256 i = 0; i < inProgressProposals.length; i++) {
            if (
                block.number >
                (proposals[inProgressProposals[i]].submissionBlockNumber).add(votingPeriod).add(executionDelay)
            ) {
                return false;
            }
        }

        return true;
    }

    // ========================================= Internal Functions =========================================

    /**
     * @notice Execute a transaction attached to a governance proposal
     * @dev We are aware of both potential re-entrancy issues and the risks associated with low-level solidity
     *      function calls here, but have chosen to keep this code with those issues in mind. All governance
     *      proposals go through a voting process, and all will be reviewed carefully to ensure that they
     *      adhere to the expected behaviors of this call - but adding restrictions here would limit the ability
     *      of the governance system to do required work in a generic way.
     * @param _targetContractAddress - address of registry proxy contract to execute transaction on
     * @param _callValue - amount of wei if a token transfer is involved
     * @param _functionSignature - function signature of the function to be executed if proposal is successful
     * @param _callData - encoded value(s) to call function with if proposal is successful
     */
    function _executeTransaction(
        address _targetContractAddress,
        uint256 _callValue,
        string memory _functionSignature,
        bytes memory _callData
    ) internal returns (bool success, bytes memory returnData)
    {
        bytes memory encodedCallData = abi.encodePacked(
            bytes4(keccak256(bytes(_functionSignature))),
            _callData
        );
        (success, returnData) = (
            // solium-disable-next-line security/no-call-value
            _targetContractAddress.call.value(_callValue)(encodedCallData)
        );

        return (success, returnData);
    }

    function _increaseVoteMagnitudeYes(uint256 _proposalId, uint256 _voterStake) internal {
        proposals[_proposalId].voteMagnitudeYes = (
            proposals[_proposalId].voteMagnitudeYes.add(_voterStake)
        );
    }

    function _increaseVoteMagnitudeNo(uint256 _proposalId, uint256 _voterStake) internal {
        proposals[_proposalId].voteMagnitudeNo = (
            proposals[_proposalId].voteMagnitudeNo.add(_voterStake)
        );
    }

    function _decreaseVoteMagnitudeYes(uint256 _proposalId, uint256 _voterStake) internal {
        proposals[_proposalId].voteMagnitudeYes = (
            proposals[_proposalId].voteMagnitudeYes.sub(_voterStake)
        );
    }

    function _decreaseVoteMagnitudeNo(uint256 _proposalId, uint256 _voterStake) internal {
        proposals[_proposalId].voteMagnitudeNo = (
            proposals[_proposalId].voteMagnitudeNo.sub(_voterStake)
        );
    }

    /**
     * @dev Can make O(1) by storing index pointer in proposals mapping.
     *      Requires inProgressProposals to be 1-indexed, since all proposals that are not present
     *          will have pointer set to 0.
     */
    function _removeFromInProgressProposals(uint256 _proposalId) internal {
        uint256 index = 0;
        for (uint256 i = 0; i < inProgressProposals.length; i++) {
            if (inProgressProposals[i] == _proposalId) {
                index = i;
                break;
            }
        }

        // Swap proposalId to end of array + pop (deletes last elem + decrements array length)
        inProgressProposals[index] = inProgressProposals[inProgressProposals.length - 1];
        inProgressProposals.pop();
    }

    /**
     * @notice Returns true if voting quorum percentage met for proposal, else false.
     * @dev Quorum is met if total voteMagnitude * 100 / total active stake in Staking
     * @dev Eventual multiplication overflow:
     *      (proposal.voteMagnitudeYes + proposal.voteMagnitudeNo), with 100% staking participation,
     *          can sum to at most the entire token supply of 10^27
     *      With 7% annual token supply inflation, multiplication can overflow ~1635 years at the earliest:
     *      log(2^256/(10^27*100))/log(1.07) ~= 1635
     */
    function _quorumMet(Proposal memory proposal, Staking stakingContract)
    internal view returns (bool)
    {
        uint256 participation = (
            (proposal.voteMagnitudeYes + proposal.voteMagnitudeNo)
            .mul(100)
            .div(stakingContract.totalStakedAt(proposal.submissionBlockNumber))
        );
        return participation >= votingQuorumPercent;
    }

    // ========================================= Private Functions =========================================

    function _requireStakingAddressIsSet() private view {
        require(
            stakingAddress != address(0x00),
            "Governance: stakingAddress is not set"
        );
    }

    function _requireServiceProviderFactoryAddressIsSet() private view {
        require(
            serviceProviderFactoryAddress != address(0x00),
            "Governance: serviceProviderFactoryAddress is not set"
        );
    }

    function _requireDelegateManagerAddressIsSet() private view {
        require(
            delegateManagerAddress != address(0x00),
            "Governance: delegateManagerAddress is not set"
        );
    }

    /**
     * @notice Helper function to perform validation for submitVote() and updateVote() functions
     * @dev Validates new _vote, _proposalId, proposal state, and voter state
     * @return stake of voter at proposal submission time
     */
    function _validateVoteAndGetVoterStake(address _voter, uint256 _proposalId, Vote _vote)
    private view returns (uint256) {
        require(
            _proposalId <= lastProposalId && _proposalId > 0,
            "Governance: Must provide valid non-zero _proposalId"
        );

        // Require voter was active Staker at proposal submission time
        uint256 voterStake = Staking(stakingAddress).totalStakedForAt(
            _voter,
            proposals[_proposalId].submissionBlockNumber
        );
        require(
            voterStake > 0,
            "Governance: Voter must be active staker with non-zero stake."
        );

        // Require proposal is still active
        require(
            proposals[_proposalId].outcome == Outcome.InProgress,
            "Governance: Cannot vote on inactive proposal."
        );

        // Require proposal votingPeriod is still active.
        uint256 submissionBlockNumber = proposals[_proposalId].submissionBlockNumber;
        uint256 endBlockNumber = submissionBlockNumber.add(votingPeriod);
        require(
            block.number > submissionBlockNumber && block.number <= endBlockNumber,
            "Governance: Proposal votingPeriod has ended"
        );

        // Require vote is either Yes or No
        require(
            _vote == Vote.Yes || _vote == Vote.No,
            "Governance: Can only submit a Yes or No vote"
        );

        return voterStake;
    }

    // solium-disable security/no-inline-assembly
    /**
     * @notice Helper function to generate the code hash for a contract address
     * @return contract code hash
     */
    function _getCodeHash(address _contract) private view returns (bytes32) {
        bytes32 contractHash;
        assembly {
          contractHash := extcodehash(_contract)
        }
        return contractHash;
    }
}
