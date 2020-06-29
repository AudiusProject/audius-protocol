pragma solidity ^0.5.0;

import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "./Staking.sol";
import "./registry/Registry.sol";
import "./InitializableV2.sol";


contract Governance is InitializableV2 {
    using SafeMath for uint;

    /**
     * @notice Address and contract instance of Audius Registry. Used to ensure this contract
     *      can only govern contracts that are registered in the Audius Registry.
     */
    Registry private registry;
    address private registryAddress;

    /// @notice Address of Audius staking contract, used to permission Governance method calls
    address private stakingAddress;

    /// @notice Period in blocks for which a governance proposal is open for voting
    uint256 private votingPeriod;

    /// @notice Required miniumum number of votes to consider a proposal valid
    uint256 private votingQuorum;

    /// @notice Max number of InProgress proposals possible at once
    uint8 private maxInProgressProposals;

    /**
     * @notice Address of account that has special Governance permissions. Can veto proposals
     *      and execute transactions directly on contracts.
     */
    address private guardianAddress;

    /***** Enums *****/

    /**
     * @notice All Proposal Outcome states.
     *      InProgress - Proposal is active and can be voted on
     *      No - Proposal votingPeriod has closed and decision is No. Proposal will not be executed.
     *      Yes - Proposal votingPeriod has closed and decision is Yes. Proposal will be executed.
     *      Invalid - Proposal votingPeriod has closed and votingQuorum was not met. Proposal will not be executed.
     *      TxFailed - Proposal voting decision was Yes, but transaction execution failed.
     *      Evaluating - Proposal voting decision was Yes, and evaluateProposalOutcome function is currently running.
     *          This status is transiently used inside that function to prevent re-entrancy.
     */
    enum Outcome {InProgress, No, Yes, Invalid, TxFailed, Evaluating}

    /**
     * @notice All Proposal Vote states for a voter.
     *      None - The default state, for any account that has not previously voted on this Proposal.
     *      No - The account voted No on this Proposal.
     *      Yes - The account voted Yes on this Proposal.
     *
     * @dev Enum values map to uints, so first value in Enum always is 0.
     */
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
        bytes returnData
    );
    event ProposalVetoed(uint256 indexed proposalId);

    /**
     * @notice Initialize the Governance contract
     * @dev _votingPeriod <= DelegateManager.undelegateLockupDuration
     * @param _registryAddress - address of the registry proxy contract
     * @param _votingPeriod - period in blocks for which a governance proposal is open for voting
     * @param _votingQuorum - required minimum number of votes to consider a proposal valid
     * @param _maxInProgressProposals - max number of InProgress proposals possible at once
     * @param _guardianAddress - address of account that has special Governance permissions
     */
    function initialize(
        address _registryAddress,
        uint256 _votingPeriod,
        uint256 _votingQuorum,
        // TODO - order vars for optimal memory data packing
        uint8 _maxInProgressProposals,
        address _guardianAddress
    ) public initializer {
        require(_registryAddress != address(0x00), "Requires non-zero _registryAddress");
        registryAddress = _registryAddress;
        registry = Registry(_registryAddress);

        require(_votingPeriod > 0, "Requires non-zero _votingPeriod");
        votingPeriod = _votingPeriod;

        require(_maxInProgressProposals > 0, "Requires non-zero _maxInProgressProposals");
        maxInProgressProposals = _maxInProgressProposals;

        require(_votingQuorum > 0, "Requires non-zero _votingQuorum");
        votingQuorum = _votingQuorum;

        require(_guardianAddress != address(0x00), "Requires non-zero _guardianAddress");
        guardianAddress = _guardianAddress;  //Guardian address becomes the only party

        InitializableV2.initialize();
    }

    // ========================================= Governance Actions =========================================

    /**
     * @notice Submit a proposal for vote. Only callable by stakers with non-zero stake.
     * @param _targetContractRegistryKey - Registry key for the contract concerning this proposal
     * @param _callValue - amount of wei to pass with function call if a token transfer is involved
     * @param _signature - function signature of the function to be executed if proposal is successful
     * @param _callData - encoded value(s) to call function with if proposal is successful
     * @param _description - Text description of proposal to be emitted in event
     */
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

        // Require all InProgress proposals that can be evaluated have been evaluated before new proposal submission
        require(
            this.inProgressProposalsAreUpToDate(),
            "Governance::submitProposal: Cannot submit new proposal until all evaluatable InProgress proposals are evaluated."
        );

        // Require new proposal submission would not push number of InProgress proposals over max number
        require(
            inProgressProposals.length <= maxInProgressProposals,
            "Governance::submitProposal: Number of InProgress proposals already at max. Please evaluate if possible, or wait for current proposals' votingPeriods to expire."
        );

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
            /* votes: mappings are auto-initialized to default state */
        });

        // Append new proposalId to inProgressProposals array
        inProgressProposals.push(newProposalId);

        emit ProposalSubmitted(
            newProposalId,
            proposer,
            block.number,
            _description
        );

        lastProposalId = lastProposalId.add(1);

        return newProposalId;
    }

    /**
     * @notice Vote on an active Proposal. Only callable by stakers with non-zero stake.
     * @param _proposalId - id of the proposal this vote is for
     * @param _vote - can be either {Yes, No} from Vote enum. No other values allowed
     */
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
        require(
            _vote == Vote.Yes || _vote == Vote.No,
            "Governance::submitProposalVote: Can only submit a Yes or No vote"
        );

        // Record previous vote.
        Vote previousVote = proposals[_proposalId].votes[voter];

        // Will override staker's previous vote if present.
        proposals[_proposalId].votes[voter] = _vote;

        /* Update voteMagnitudes accordingly */

        // New voter (Vote enum defaults to 0)
        if (previousVote == Vote.None) {
            if (_vote == Vote.Yes) {
                _increaseVoteMagnitudeYes(_proposalId, voterStake);
            } else {
                _increaseVoteMagnitudeNo(_proposalId, voterStake);
            }
            // New voter -> increase numVotes
            proposals[_proposalId].numVotes = proposals[_proposalId].numVotes.add(1);
        } else { // Repeat voter
            if (previousVote == Vote.Yes && _vote == Vote.No) {
                _decreaseVoteMagnitudeYes(_proposalId, voterStake);
                _increaseVoteMagnitudeNo(_proposalId, voterStake);
            } else if (previousVote == Vote.No && _vote == Vote.Yes) {
                _decreaseVoteMagnitudeNo(_proposalId, voterStake);
                _increaseVoteMagnitudeYes(_proposalId, voterStake);
            }

            // If _vote == previousVote, no changes needed to vote magnitudes.

            // Repeat voter -> numVotes unchanged
        }

        emit ProposalVoteSubmitted(
            _proposalId,
            voter,
            _vote,
            voterStake,
            previousVote
        );
    }

    /**
     * @notice Once the voting period for a proposal has ended, evaluate the outcome and
     *      execute the proposal if stake-weighted vote is >= 50% Yes and voting quorum met.
     * @dev Requires that caller is an active staker at the time the proposal is created
     * @param _proposalId - id of the proposal
     */
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

        // Re-entrancy should not be possible here since this switches the status of the
        // proposal to 'Evaluating' so it should fail the status is 'InProgress' check
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

    /**
     * @notice Set the Staking address
     * @dev Only callable by self via _executeTransaction
     * @param _stakingAddress - address for new Staking contract
     */
    function setStakingAddress(address _stakingAddress) external {
        require(msg.sender == address(this), "Only callable by self");
        require(_stakingAddress != address(0x00), "Requires non-zero _stakingAddress");
        stakingAddress = _stakingAddress;
    }

    /**
     * @notice Set the voting period for a Governance proposal
     * @dev Only callable by self via _executeTransaction
     * @param _votingPeriod - new voting period
     */
    function setVotingPeriod(uint256 _votingPeriod) external {
        require(msg.sender == address(this), "Only callable by self");
        votingPeriod = _votingPeriod;
    }

    /**
     * @notice Set the voting quorum for a Governance proposal
     * @dev Only callable by self via _executeTransaction
     * @param _votingQuorum - new voting period
     */
    function setVotingQuorum(uint256 _votingQuorum) external {
        require(msg.sender == address(this), "Only callable by self");
        votingQuorum = _votingQuorum;
    }

    /**
     * @notice Set the Registry address
     * @dev Only callable by self via _executeTransaction
     * @param _registryAddress - address for new Registry contract
     */
    function setRegistryAddress(address _registryAddress) external {
        require(msg.sender == address(this), "Only callable by self");
        require(_registryAddress != address(0x00), "Requires non-zero _registryAddress");
        registryAddress = _registryAddress;
        registry = Registry(_registryAddress);
    }

    /**
     * @notice Set the max number of concurrent InProgress proposals
     * @dev Only callable by self via _executeTransaction
     * @param _newMaxInProgressProposals - new value for maxInProgressProposals
     */
    function setMaxInProgressProposals(uint8 _newMaxInProgressProposals) external {
        require(msg.sender == address(this), "Only callable by self");
        require(_newMaxInProgressProposals > 0, "Requires non-zero _newMaxInProgressProposals");
        maxInProgressProposals = _newMaxInProgressProposals;
    }

    // ========================================= Guardian Actions =========================================

    /**
     * @notice Allows the guardianAddress to execute protocol actions
     * @param _targetContractRegistryKey - key in registry of target contraact
     * @param _callValue - amount of wei if a token transfer is involved
     * @param _signature - function signature of the function to be executed if proposal is successful
     * @param _callData - encoded value(s) to call function with if proposal is successful
     */
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

        // _targetContractRegistryKey must point to a valid registered contract
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

        require(success, "Governance::guardianExecuteTransaction: Transaction failed.");

        emit GuardianTransactionExecuted(
            targetContractAddress,
            _callValue,
            _signature,
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
            "Governance::guardianExecuteTransaction: Only guardian."
        );

        guardianAddress = _newGuardianAddress;
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

    /**
     * @notice Get how a voter voted for a given proposal
     * @param _proposalId - id of the proposal
     * @param _voter - address of the voter we want to check
     * @return returns a value from the Vote enum if a valid vote, otherwise returns no value
     */
    function getVoteByProposalAndVoter(uint256 _proposalId, address _voter)
    external view returns (Vote vote)
    {
        require(
            _proposalId <= lastProposalId && _proposalId > 0,
            "Must provide valid non-zero _proposalId"
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
        return stakingAddress;
    }

    /// @notice Get the contract voting period
    function getVotingPeriod() external view returns (uint) {
        _requireIsInitialized();

        return votingPeriod;
    }

    /// @notice Get the contract voting quorum
    function getVotingQuorum() external view returns (uint) {
        _requireIsInitialized();

        return votingQuorum;
    }

    /// @notice Get the registry address
    function getRegistryAddress() external view returns (address) {
        return registryAddress;
    }

    /// @notice Get the max number of concurrent InProgress proposals
    function getMaxInProgressProposals() external view returns (uint8) {
        return maxInProgressProposals;
    }

    /// @notice Get the array of all InProgress proposal Ids
    function getInProgressProposals() external view returns (uint256[] memory) {
        return inProgressProposals;
    }

    /**
     * @notice Returns false if any proposals in inProgressProposals array are evaluatable
     *          Evaluatable = proposals with closed votingPeriod
     * @dev Is public since its called internally in `submitProposal()` as well as externally in UI
     */
    function inProgressProposalsAreUpToDate() external view returns (bool) {
        // compare current block number against endBlockNumber of each proposal
        for (uint i = 0; i < inProgressProposals.length; i++) {
            if (
                block.number >
                (proposals[inProgressProposals[i]].startBlockNumber).add(votingPeriod)
            ) {
                return false;
            }
        }

        return true;
    }

    // ========================================= Internal Functions =========================================

    /**
     * @notice Execute a transaction attached to a governanace proposal
     * @dev We are aware of both potential re-entrancy issues and the risks associated with low-level solidity
     *      function calls here, but have chosen to keep this code with those issues in mind. All governance
     *      proposals go through a voting process, and all will be reviewed carefully to ensure that they
     *      adhere to the expected behaviors of this call - but adding restrictions here would limit the ability
     *      of the governance system to do required work in a generic way.
     * @param _targetContractAddress - address of registry proxy contract to execute transaction on
     * @param _callValue - amount of wei if a token transfer is involved
     * @param _signature - function signature of the function to be executed if proposal is successful
     * @param _callData - encoded value(s) to call function with if proposal is successful
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
        bool found = false;
        for (uint i = 0; i < inProgressProposals.length; i++) {
            if (inProgressProposals[i] == _proposalId) {
                index = i;
                found = true;
                break;
            }
        }
        require(
            found == true,
            "Governance::_removeFromInProgressProposals: Could not find InProgress proposal."
        );

        // Swap proposalId to end of array + pop (deletes last elem + decrements array length)
        inProgressProposals[index] = inProgressProposals[inProgressProposals.length - 1];
        inProgressProposals.pop();
    }
}
