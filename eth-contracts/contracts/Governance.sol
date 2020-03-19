pragma solidity ^0.5.0;

import "./service/registry/RegistryContract.sol";
import "./staking/Staking.sol";
import "./service/interface/registry/RegistryInterface.sol";

contract Governance {
  RegistryInterface registry = RegistryInterface(0);
  bytes32 stakingProxyOwnerKey;

  // 48hr * 60 min/hr * 60 sec/min / ~15 sec/block = 11520 blocks
  uint256 votingPeriod = 11520;

  uint256 votingQuorum = 1;

  /***** Enums *****/
  enum Outcome {InProgress, No, Yes, Invalid}
  // Enum values map to uints, so first value in Enum always is 0.
  enum Vote {None, No, Yes}

  struct SlashProposal {
    uint256 proposalId;
    address proposer;
    uint256 startBlockNumber;
    address target;
    uint256 slashAmount;
    Outcome outcome;
    uint256 voteMagnitudeYes;
    uint256 voteMagnitudeNo;
    uint256 numVotes;
    mapping(address => Vote) votes;
  }

  /***** SlashProposal storage *****/
  uint256 lastProposalId;
  mapping(uint256 => SlashProposal) slashProposals;

  /***** Events *****/
  event SlashProposalSubmitted(
    uint256 indexed proposalId,
    address proposer,
    uint256 startBlockNumber,
    address indexed target,
    uint256 indexed slashAmount,
    Outcome outcome,
    uint256 voteMagnitudeYes,
    uint256 voteMagnitudeNo,
    uint256 numVotes
  );
  event SlashProposalVoteSubmitted(
    uint256 indexed proposalId,
    address indexed voter,
    Vote indexed vote,
    uint256 voterStake,
    Vote previousVote
  );
  event SlashProposalOutcomeEvaluated(
    uint256 indexed proposalId,
    Outcome indexed outcome,
    uint256 voteMagnitudeYes,
    uint256 voteMagnitudeNo,
    uint256 numVotes
  );

  constructor(
    address _registryAddress,
    bytes32 _stakingProxyOwnerKey,
    uint256 _votingPeriod
  ) public {
    require(_registryAddress != address(0x00), "Requires non-zero _registryAddress");
    registry = RegistryInterface(_registryAddress);
    stakingProxyOwnerKey = _stakingProxyOwnerKey;

    require(_votingPeriod > 0, "Requires non-zero _votingPeriod");
    votingPeriod = _votingPeriod;

    lastProposalId = 0;
  }

  // ========================================= Governance Actions =========================================

  function submitSlashProposal(address _target, uint256 _amount)
  external returns (uint256 proposalId)
  {
    address proposer = msg.sender;

    // Require proposer is active Staker.
    Staking stakingContract = Staking(registry.getContract(stakingProxyOwnerKey));
    require(
      stakingContract.totalStakedFor(proposer) > 0,
      "Proposer must be active staker with non-zero stake."
    );

    // Require: _target is active Staker with stake >= slash amount.
    require(
      stakingContract.totalStakedFor(_target) >= _amount,
      "Target must be active staker with stake >= proposed slash amount."
    );

    require (_amount > 0, "Slash amount must be greater than 0");

    // set proposalId.
    uint256 newProposalId = lastProposalId + 1;

    // Create new Proposal obj and store in slashProposals mapping.
    slashProposals[newProposalId] = SlashProposal({
      proposalId: newProposalId,
      proposer: proposer,
      startBlockNumber: block.number,
      target: _target,
      slashAmount: _amount,
      outcome: Outcome.InProgress,
      voteMagnitudeYes: 0,
      voteMagnitudeNo: 0,
      numVotes: 0
      /** votes: mappings are auto-initialized to default state. */
    });

    emit SlashProposalSubmitted(
      newProposalId,
      proposer,
      block.number,
      _target,
      _amount,
      Outcome.InProgress,
      0,  // voteMagnitudeYes
      0,  // voteMagnitudeNo
      0   // numVotes
    );

    lastProposalId += 1;

    return newProposalId;
  }

  function submitSlashProposalVote(uint256 _proposalId, Vote _vote) external
  {
    address voter = msg.sender;

    require(_proposalId <= lastProposalId && _proposalId > 0, "Must provide valid non-zero _proposalId");

    // Require voter is active Staker + get voterStake.
    Staking stakingContract = Staking(registry.getContract(stakingProxyOwnerKey));
    uint256 voterStake = stakingContract.totalStakedForAt(
      voter,
      slashProposals[_proposalId].startBlockNumber
    );
    require(voterStake > 0, "Voter must be active staker with non-zero stake.");

    // Require proposal votingPeriod is still active.
    uint256 startBlockNumber = slashProposals[_proposalId].startBlockNumber;
    uint256 endBlockNumber = startBlockNumber + votingPeriod;
    require(
      block.number > startBlockNumber && block.number <= endBlockNumber,
      "Proposal votingPeriod has ended"
    );

    // Require vote is not None.
    require(_vote != Vote.None, "Cannot submit None vote");

    // Record previous vote.
    Vote previousVote = slashProposals[_proposalId].votes[voter];

    // Will override staker's previous vote if present.
    slashProposals[_proposalId].votes[voter] = _vote;

    /** Update voteMagnitudes accordingly */

    // New voter (Vote enum defaults to 0)
    if (previousVote == Vote.None) {
      if (_vote == Vote.Yes) {
        slashProposals[_proposalId].voteMagnitudeYes += voterStake;
      } else {
        slashProposals[_proposalId].voteMagnitudeNo += voterStake;
      }
      slashProposals[_proposalId].numVotes += 1;
    }
    // Repeat voter
    else {
      if (previousVote == Vote.Yes && _vote == Vote.No) {
        slashProposals[_proposalId].voteMagnitudeYes -= voterStake;
        slashProposals[_proposalId].voteMagnitudeNo += voterStake;
      }
      else if (previousVote == Vote.No && _vote == Vote.Yes) {
        slashProposals[_proposalId].voteMagnitudeYes += voterStake;
        slashProposals[_proposalId].voteMagnitudeNo -= voterStake;
      }
      // If _vote == previousVote, no changes needed to vote magnitudes.
    }

    emit SlashProposalVoteSubmitted(
      _proposalId,
      voter,
      _vote,
      voterStake,
      previousVote
    );
  }

  function evaluateSlashProposalOutcome(uint256 _proposalId)
  external returns (Outcome proposalOutcome)
  {
    require(_proposalId <= lastProposalId && _proposalId > 0, "Must provide valid non-zero _proposalId");

    // Require msg.sender is active Staker.
    Staking stakingContract = Staking(registry.getContract(stakingProxyOwnerKey));
    require(
      stakingContract.totalStakedForAt(
        msg.sender, slashProposals[_proposalId].startBlockNumber
      ) > 0,
      "Caller must be active staker with non-zero stake."
    );

    // Require proposal votingPeriod has ended.
    uint256 startBlockNumber = slashProposals[_proposalId].startBlockNumber;
    uint256 endBlockNumber = startBlockNumber + votingPeriod;
    require(
      block.number > endBlockNumber,
      "Proposal votingPeriod must end before evaluation."
    );

    // Calculate outcome
    Outcome outcome;
    if (slashProposals[_proposalId].numVotes < votingQuorum) {
      outcome = Outcome.Invalid;
    }
    else if (
      slashProposals[_proposalId].voteMagnitudeYes >= slashProposals[_proposalId].voteMagnitudeNo
    ) {
      outcome = Outcome.Yes;

      // Slash target's stake.
      stakingContract.slash(
        slashProposals[_proposalId].slashAmount,
        slashProposals[_proposalId].target
      );
    } else {
      outcome = Outcome.No;
    }

    // Record outcome
    slashProposals[_proposalId].outcome = outcome;

    emit SlashProposalOutcomeEvaluated(
      _proposalId,
      outcome,
      slashProposals[_proposalId].voteMagnitudeYes,
      slashProposals[_proposalId].voteMagnitudeNo,
      slashProposals[_proposalId].numVotes
      /** @notice omitted: proposer, startBlockNumber, target, slashAmount, outcome */
    );

    return outcome;
  }

  // ========================================= Getters =========================================

  function getSlashProposalById(uint256 _proposalId)
  external view returns (
    uint256 proposalId,
    address proposer,
    uint256 startBlockNumber,
    address target,
    uint256 slashAmount,
    Outcome outcome,
    uint256 voteMagnitudeYes,
    uint256 voteMagnitudeNo,
    uint256 numVotes
  ) {
    require(_proposalId <= lastProposalId && _proposalId > 0, "Must provide valid non-zero _proposalId");

    SlashProposal memory proposal = slashProposals[_proposalId];
    return (
      proposal.proposalId,
      proposal.proposer,
      proposal.startBlockNumber,
      proposal.target,
      proposal.slashAmount,
      proposal.outcome,
      proposal.voteMagnitudeYes,
      proposal.voteMagnitudeNo,
      proposal.numVotes
      /** @notice - votes mapping cannot be returned by external function */
    );
  }

  function getVoteBySlashProposalAndVoter(uint256 _proposalId, address _voter)
  external view returns (Vote vote)
  {
    require(_proposalId <= lastProposalId && _proposalId > 0, "Must provide valid non-zero _proposalId");
    return slashProposals[_proposalId].votes[_voter];
  }

}