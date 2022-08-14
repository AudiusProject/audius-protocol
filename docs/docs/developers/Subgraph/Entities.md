---
sidebar_position: 2
title: Subgraph Entities
---

# Entities
- Addresses
- Token
- Staking global aggregate values
- Delegate global aggregate values 
- Service Provider Factory globals
- Claims Manager globals
- Governance globals 
- Helper for lockup event
- Keep track of delegations to/from
- Keep track of pending events
- Delegation & Staking Event Mappings 
- Regular events
- Governance Proposals & Votes Event Mappings  

##  Addresses
Description: Unsure?

| Field | Type | Description |
| ----------- | ----------- | ----------- |
| audiusTokenAddress | Bytes| audiusToken address|
| claimsManagerAddress| Bytes| claimsManager address |
| delegateManagerAddress| Bytes | delegateManager address |
| governanceAddress| Bytes| governance address|
| registry| Bytes| registry address|
| serviceProviderFactoryAddress| Bytes|serviceProviderFactory address|
| serviceTypeManagerAddress| Bytes |serviceTypeManager address|
| stakingAddress| Bytes | staking address|
| registryAddress| Bytes | registry address|
   

  # Token 
Description:

  | Field | Type | Description |
| ----------- | ----------- | ----------- |
  |totalSupply| BigInt!|Total supply of $AUDIO|
  |totalAUDIOMinted| BigInt!|Total amount of $AUDIO minted|
  |totalAUDIOBurned| BigInt!|Total amount of $AUDIO burned|
  

  # Staking global aggregate values
  Description:

   | Field | Type | Description |
| ----------- | ----------- | ----------- |
|totalTokensStaked| BigInt|Total amount of $AUDIO staked|
| totalTokensClaimable| BigInt|Total tokens that are settled and claimable|
|totalTokensLocked| BigInt |Total tokens that are currently locked or withdrawable in the network from unstaking/undelegating|
| totalTokensDelegated| BigInt|Total delegated tokens in the protocol|
  


  # Delegate global aggregate values 
  Description:

  | Field | Type | Description |
| ----------- | ----------- | ----------- |
|maxDelegators| BigInt|The max number of delegators per service provider|
| inDelegationAmount| BigInt| The minimum amount needed to delegate|
| undelegateLockupDuration| BigInt|  The minimum number of blocks the user must wait from requesting undelegation to evaluating|
|removeDelegatorLockupDuration| BigInt|  The minimum number of blocks the user must wait from requesting remove delegator to evaluating| 
|removeDelegatorEvalDuration| BigInt|Evaluation period for a remove delegator request|
  

  # Service Provider Factory globals 
  Description: 

  | Field | Type | Description |
| ----------- | ----------- | ----------- |
  |decreaseStakeLockupDuration| BigInt |Number of blocks a decrease stake request is in lockup before evaluation is allowed|
  |updateDeployerCutLockupDuration| BigInt |Number of blocks an update deployer cut request is in lockup before evaluation is allowed|
 


  # Claims Manager globals 
  Description: 

  | Field | Type | Description |
| ----------- | ----------- | ----------- |
  |fundingRoundBlockDiff| BigInt|  |
  |fundingAmount| BigInt|  |
  |recurringCommunityFundingAmount| BigInt|  |
  |communityPoolAddress| Bytes | address|

  # Governance globals 
  Description:  

  | Field | Type | Description |
| ----------- | ----------- | ----------- |
  |votingQuorumPercent| BigInt|  |
  |votingPeriod| BigInt|  |
  |executionDelay| BigInt|  |
  |maxInProgressProposals| Int|  |
  |guardianAddress| Bytes|  |

  # Helper for lockup event
  | Field | Type | Description |
| ----------- | ----------- | ----------- |
|requestCount| BigInt!|  |
|totalStaked| BigInt!|  


  # ServiceType 
  | Field | Type | Description |
| ----------- | ----------- | ----------- |
|id| ID|The type of the service ie. creator-node
| isValid| Boolean! |If the service is removed of not|
|minStake| BigInt! |Minimum Token Stake to run the service|
|maxStake| BigInt!|Max Token Stake to run the service|
|versions| [ServiceTypeVersion!]! @derivedFrom(field: serviceType")|


 # ServiceTypeVersion
| Field | Type | Description |
| ----------- | ----------- | ----------- |
|id| ID!|   |
|serviceType| ServiceType!|  |
|serviceVersion| String!|  |
|blockNumber| BigInt!|  


 # ServiceNode
| Field | Type | Description |
| ----------- | ----------- | ----------- |
  |id| ID!|ID - generated from service-type and spID|
  |spId| BigInt!|Service provider ID - autoincrementing id created for each new service node|
  |owner| User!|Reference to user that registered this service|
  |type| ServiceType!|Reference to the service type
  |endpoint| String!|URI to access the service node|
  |delegateOwnerWallet| Bytes!|Address used to confirm the ownership of the service node|
  |createdAt| Int!|When the service node was created|
  |isRegistered| Boolean!|Boolean if th service is registered/deregistered|

 # User
| Field | Type | Description |
| ----------- | ----------- | ----------- |
| id| ID!| Eth address of User|
| balance| BigInt!|Token balance|
|totalClaimableAmount| BigInt!|The total staked/delegated minus pending decrease stake/delegation|
|claimableStakeAmount| BigInt!|The total staked minus pending decrease stake|
|claimableDelegationReceivedAmount| BigInt!|The total delegation received from other users minus their pending decrease delegation|
 | claimableDelegationSentAmount| BigInt!|The total delegation sent to other users minus my own pending decrease delegation|
|stakeAmount| BigInt!|The total staked|
|delegationReceivedAmount| BigInt!|The total delegated|
|delegationSentAmount| BigInt!|The total delegation sent|
|hasStakeOrDelegation| Boolean!|Boolean set to true if the user has stake or delegation|
|validBounds| Boolean| If the user's stake is between the min/max stake|
|deployerCut| BigInt|The percentage of the claim from the delegator that the the deployer takes|
|services|[ServiceNode!] @derivedFrom(field: "owner")|List of services operated by the user|
|minAccountStake|BigInt|Max stake of the user as determined by number of services and service types|
|maxAccountStake| BigInt| Min stake of the user as determined by number of services and service types|
|delegateTo|[Delegate!] @derivedFrom(field: "fromUser")| Reference to delegations (user & amount) sent by user|
|delegateFrom| [Delegate!] @derivedFrom(field: "toUser")|Reference to delegations (user & amount) received by user|
|pendingDecreaseStake| DecreaseStakeEvent|Reference to request to pending decrease stake|
|pendingRemoveDelegator| RemoveDelegatorEvent|DEPRECATED: Use event with service operator and delegator id|
|pendingUpdateDeployerCut| UpdateDeployerCutEvent|Reference to request to update deployer cut
|pendingUndelegateStake| UndelegateStakeEvent|  Reference to request to update undelegate stake| 
|votes| [Vote!] @derivedFrom(field: "voter")|Reference to votes by the user|
|createdAt| BigInt!|  |

type Delegate @entity {
  "ID - generated w/ the service provider's & delegator's addresses"
  id: ID!
  "The amount delegated minus the pending decrease delegation"
  claimableAmount: BigInt!
  "The amount delegated"
  amount: BigInt!
  "Reference to the user sending/delegating tokens"
  fromUser: User!
  "Reference to the user receiving delegation"
  toUser: User!
}

# ==================== Delegation & Staking Event Mappings ============================== 
enum LockupStatus {
  Requested
  Cancelled
  Evaluated
}

interface LockupEvent {
  id: ID!
  status: LockupStatus!
  owner: User!
  expiryBlock: BigInt!
  createdBlockNumber: BigInt!
  endedBlockNumber: BigInt
}

type DecreaseStakeEvent implements LockupEvent @entity {
  id: ID!
  status: LockupStatus!
  owner: User!
  expiryBlock: BigInt!
  createdBlockNumber: BigInt!
  endedBlockNumber: BigInt

  decreaseAmount: BigInt!
  newStakeAmount: BigInt
}

type UpdateDeployerCutEvent implements LockupEvent @entity {
  id: ID!
  status: LockupStatus!
  owner: User!
  expiryBlock: BigInt!
  createdBlockNumber: BigInt!
  endedBlockNumber: BigInt

  updatedCut: BigInt!
}

type RemoveDelegatorEvent implements LockupEvent @entity {
  id: ID!
  status: LockupStatus!
  owner: User!
  expiryBlock: BigInt!
  createdBlockNumber: BigInt!
  endedBlockNumber: BigInt

  delegator: User!
}

type UndelegateStakeEvent implements LockupEvent @entity {
  id: ID!
  status: LockupStatus!
  owner: User!
  expiryBlock: BigInt!
  createdBlockNumber: BigInt!
  endedBlockNumber: BigInt

  serviceProvider: User!
  amount: BigInt!
}

# Regular events
type IncreasedStakeEvent @entity {
  id: ID!
  owner: User!
  newStakeAmount: BigInt!
  increaseAmount: BigInt!
  blockNumber: BigInt!
}

type IncreaseDelegatedStakeEvent @entity {
  id: ID!
  delegator: User!
  serviceProvider: User!
  increaseAmount: BigInt!
  blockNumber: BigInt!
}

type ClaimEvent @entity {
  id: ID!
  claimer: User!
  rewards: BigInt!
  newTotal: BigInt!
  blockNumber: BigInt!
}

type SlashEvent @entity {
  id: ID!
  target: User!
  amount: BigInt!
  newTotal: BigInt!
  blockNumber: BigInt!
}

type ClaimRound @entity {
  "The round number"
  id: ID!
  fundAmount: BigInt!
  blockNumber: BigInt!
}

type ClaimProcessedEvent @entity {
  id: ID!
  rewards: BigInt!
  claimer: User!
  oldTotal: BigInt!
  newTotal: BigInt!
  blockNumber: BigInt!
}

type RegisteredServiceProviderEvent @entity {
  id: ID!
  type: ServiceType!
  spId: BigInt!
  node: ServiceNode!
  owner: User!
  endpoint: String!
  stakeAmount: BigInt!
  blockNumber: BigInt!
}

type DeregisteredServiceProviderEvent @entity {
  id: ID!
  type: ServiceType!
  spId: BigInt!
  node: ServiceNode!
  owner: User!
  endpoint: String!
  unstakeAmount: BigInt!
  blockNumber: BigInt!
}


# ==================== Governance Proposals & Votes Event Mappings ============================== 

# TODO: implement the enum by converting the raw event type to string enum

# Voting Events
enum VoteType {
  None
  Yes
  No
}

# enum in sol
enum Outcome {
  InProgress
  Rejected
  ApprovedExecuted
  QuorumNotMet
  ApprovedExecutionFailed
  Evaluating
  Vetoed
  TargetContractAddressChanged
  TargetContractCodeHashChanged
}

type Proposal @entity {
  "Proposal ID from the event (auto-incrementing)"
  id: ID!
  "Proposal name"
  name: String!
  "Proposal description"
  description: String!
  "Reference to the user submitting the proposal"
  proposer: User!
  submissionBlockNumber: BigInt!
  targetContractRegistryKey: Bytes!
  targetContractAddress: Bytes!
  callValue: BigInt!
  functionSignature: String!
  callData: Bytes!

  "TODO: convert int to enum - Outcome"
  outcome: Outcome
  "Total vote weight for 'Yes'"
  voteMagnitudeYes: BigInt!
  "Total vote weight for 'No'"
  voteMagnitudeNo: BigInt!
  "Number of votes"
  numVotes: BigInt!
  "Reference to the votes - user & vote weight"
  votes: [Vote!]! @derivedFrom(field: "proposal")
}

type Vote @entity {
  "ID - generated from proposal id and user address"
  id: ID!
  "Reference to the proposal"
  proposal: Proposal!
  "TODO: update to enum - the voter's vote"
  vote: VoteType
  "The vote weight - the voter's claimable stake"
  magnitude: BigInt!
  "Reference the the user submitting the voter"
  voter: User!
  "The block number the vote was created"
  createdBlockNumber: BigInt!
  "The block number the vote was updated"
  updatedBlockNumber: BigInt
}

type ProposalSubmittedEvent @entity {
  id: ID!
  proposal: Proposal!
  proposer: User!
  name: String!
  description: String!
}

type ProposalVoteSubmittedEvent @entity {
  id: ID!
  proposal: Proposal!
  voter: User!
  vote: Vote!
  currentVote: VoteType!
  voterStake: BigInt!
  blockNumber: BigInt!
}

type ProposalVoteUpdatedEvent @entity {
  id: ID!
  proposal: Proposal!
  voter: User!
  vote: Vote!
  voterStake: BigInt!
  currentVote: VoteType!
  previousVote: VoteType!
  blockNumber: BigInt!
}

type ProposalOutcomeEvaluatedEvent @entity {
  id: ID!
  proposal: Proposal!
  outcome: Outcome
  voteMagnitudeYes: BigInt!
  voteMagnitudeNo: BigInt!
  numVotes: BigInt!
  blockNumber: BigInt!
}

type ProposalTransactionExecutedEvent @entity {
  id: ID!
  proposal: Proposal!
  success: Boolean!
  returnData: Bytes
  blockNumber: BigInt!
}

type GuardianTransactionExecutedEvent @entity {
  id: ID!
  targetContractAddress: Bytes!
  callValue: BigInt!
  functionSignature: String!
  callData: Bytes!
  returnData: Bytes!
  blockNumber: BigInt!
}

type ProposalVetoedEvent @entity {
  id: ID!
  proposal: Proposal!
  blockNumber: BigInt!
}
Footer
© 2022 GitHub, Inc.
Footer navigation
Terms
Privacy
