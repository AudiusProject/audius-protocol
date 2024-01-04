export const abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: '_newExecutionDelay',
        type: 'uint256'
      }
    ],
    name: 'ExecutionDelayUpdated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: '_targetContractAddress',
        type: 'address'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: '_callValue',
        type: 'uint256'
      },
      {
        indexed: true,
        internalType: 'string',
        name: '_functionSignature',
        type: 'string'
      },
      {
        indexed: true,
        internalType: 'bytes',
        name: '_callData',
        type: 'bytes'
      },
      {
        indexed: false,
        internalType: 'bytes',
        name: '_returnData',
        type: 'bytes'
      }
    ],
    name: 'GuardianTransactionExecuted',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: '_newGuardianAddress',
        type: 'address'
      }
    ],
    name: 'GuardianshipTransferred',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: '_newMaxInProgressProposals',
        type: 'uint256'
      }
    ],
    name: 'MaxInProgressProposalsUpdated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: '_proposalId',
        type: 'uint256'
      },
      {
        indexed: true,
        internalType: 'enum Governance.Outcome',
        name: '_outcome',
        type: 'uint8'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: '_voteMagnitudeYes',
        type: 'uint256'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: '_voteMagnitudeNo',
        type: 'uint256'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: '_numVotes',
        type: 'uint256'
      }
    ],
    name: 'ProposalOutcomeEvaluated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: '_proposalId',
        type: 'uint256'
      },
      {
        indexed: true,
        internalType: 'address',
        name: '_proposer',
        type: 'address'
      },
      {
        indexed: false,
        internalType: 'string',
        name: '_name',
        type: 'string'
      },
      {
        indexed: false,
        internalType: 'string',
        name: '_description',
        type: 'string'
      }
    ],
    name: 'ProposalSubmitted',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: '_proposalId',
        type: 'uint256'
      },
      {
        indexed: true,
        internalType: 'bool',
        name: '_success',
        type: 'bool'
      },
      {
        indexed: false,
        internalType: 'bytes',
        name: '_returnData',
        type: 'bytes'
      }
    ],
    name: 'ProposalTransactionExecuted',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: '_proposalId',
        type: 'uint256'
      }
    ],
    name: 'ProposalVetoed',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: '_proposalId',
        type: 'uint256'
      },
      {
        indexed: true,
        internalType: 'address',
        name: '_voter',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'enum Governance.Vote',
        name: '_vote',
        type: 'uint8'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: '_voterStake',
        type: 'uint256'
      }
    ],
    name: 'ProposalVoteSubmitted',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: '_proposalId',
        type: 'uint256'
      },
      {
        indexed: true,
        internalType: 'address',
        name: '_voter',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'enum Governance.Vote',
        name: '_vote',
        type: 'uint8'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: '_voterStake',
        type: 'uint256'
      },
      {
        indexed: false,
        internalType: 'enum Governance.Vote',
        name: '_previousVote',
        type: 'uint8'
      }
    ],
    name: 'ProposalVoteUpdated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: '_newRegistryAddress',
        type: 'address'
      }
    ],
    name: 'RegistryAddressUpdated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: '_newVotingPeriod',
        type: 'uint256'
      }
    ],
    name: 'VotingPeriodUpdated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: '_newVotingQuorumPercent',
        type: 'uint256'
      }
    ],
    name: 'VotingQuorumPercentUpdated',
    type: 'event'
  },
  {
    constant: false,
    inputs: [
      {
        internalType: 'address',
        name: '_registryAddress',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: '_votingPeriod',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: '_executionDelay',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: '_votingQuorumPercent',
        type: 'uint256'
      },
      {
        internalType: 'uint16',
        name: '_maxInProgressProposals',
        type: 'uint16'
      },
      {
        internalType: 'address',
        name: '_guardianAddress',
        type: 'address'
      }
    ],
    name: 'initialize',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [],
    name: 'initialize',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        internalType: 'bytes32',
        name: '_targetContractRegistryKey',
        type: 'bytes32'
      },
      {
        internalType: 'uint256',
        name: '_callValue',
        type: 'uint256'
      },
      {
        internalType: 'string',
        name: '_functionSignature',
        type: 'string'
      },
      {
        internalType: 'bytes',
        name: '_callData',
        type: 'bytes'
      },
      {
        internalType: 'string',
        name: '_name',
        type: 'string'
      },
      {
        internalType: 'string',
        name: '_description',
        type: 'string'
      }
    ],
    name: 'submitProposal',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        internalType: 'uint256',
        name: '_proposalId',
        type: 'uint256'
      },
      {
        internalType: 'enum Governance.Vote',
        name: '_vote',
        type: 'uint8'
      }
    ],
    name: 'submitVote',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        internalType: 'uint256',
        name: '_proposalId',
        type: 'uint256'
      },
      {
        internalType: 'enum Governance.Vote',
        name: '_vote',
        type: 'uint8'
      }
    ],
    name: 'updateVote',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        internalType: 'uint256',
        name: '_proposalId',
        type: 'uint256'
      }
    ],
    name: 'evaluateProposalOutcome',
    outputs: [
      {
        internalType: 'enum Governance.Outcome',
        name: '',
        type: 'uint8'
      }
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        internalType: 'uint256',
        name: '_proposalId',
        type: 'uint256'
      }
    ],
    name: 'vetoProposal',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        internalType: 'address',
        name: '_stakingAddress',
        type: 'address'
      }
    ],
    name: 'setStakingAddress',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        internalType: 'address',
        name: '_serviceProviderFactoryAddress',
        type: 'address'
      }
    ],
    name: 'setServiceProviderFactoryAddress',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        internalType: 'address',
        name: '_delegateManagerAddress',
        type: 'address'
      }
    ],
    name: 'setDelegateManagerAddress',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        internalType: 'uint256',
        name: '_votingPeriod',
        type: 'uint256'
      }
    ],
    name: 'setVotingPeriod',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        internalType: 'uint256',
        name: '_votingQuorumPercent',
        type: 'uint256'
      }
    ],
    name: 'setVotingQuorumPercent',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        internalType: 'address',
        name: '_registryAddress',
        type: 'address'
      }
    ],
    name: 'setRegistryAddress',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        internalType: 'uint16',
        name: '_newMaxInProgressProposals',
        type: 'uint16'
      }
    ],
    name: 'setMaxInProgressProposals',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        internalType: 'uint256',
        name: '_newExecutionDelay',
        type: 'uint256'
      }
    ],
    name: 'setExecutionDelay',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        internalType: 'bytes32',
        name: '_targetContractRegistryKey',
        type: 'bytes32'
      },
      {
        internalType: 'uint256',
        name: '_callValue',
        type: 'uint256'
      },
      {
        internalType: 'string',
        name: '_functionSignature',
        type: 'string'
      },
      {
        internalType: 'bytes',
        name: '_callData',
        type: 'bytes'
      }
    ],
    name: 'guardianExecuteTransaction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        internalType: 'address',
        name: '_newGuardianAddress',
        type: 'address'
      }
    ],
    name: 'transferGuardianship',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [
      {
        internalType: 'uint256',
        name: '_proposalId',
        type: 'uint256'
      }
    ],
    name: 'getProposalById',
    outputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256'
      },
      {
        internalType: 'address',
        name: 'proposer',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'submissionBlockNumber',
        type: 'uint256'
      },
      {
        internalType: 'bytes32',
        name: 'targetContractRegistryKey',
        type: 'bytes32'
      },
      {
        internalType: 'address',
        name: 'targetContractAddress',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'callValue',
        type: 'uint256'
      },
      {
        internalType: 'string',
        name: 'functionSignature',
        type: 'string'
      },
      {
        internalType: 'bytes',
        name: 'callData',
        type: 'bytes'
      },
      {
        internalType: 'enum Governance.Outcome',
        name: 'outcome',
        type: 'uint8'
      },
      {
        internalType: 'uint256',
        name: 'voteMagnitudeYes',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'voteMagnitudeNo',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'numVotes',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [
      {
        internalType: 'uint256',
        name: '_proposalId',
        type: 'uint256'
      }
    ],
    name: 'getProposalTargetContractHash',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [
      {
        internalType: 'uint256',
        name: '_proposalId',
        type: 'uint256'
      },
      {
        internalType: 'address',
        name: '_voter',
        type: 'address'
      }
    ],
    name: 'getVoteInfoByProposalAndVoter',
    outputs: [
      {
        internalType: 'enum Governance.Vote',
        name: 'vote',
        type: 'uint8'
      },
      {
        internalType: 'uint256',
        name: 'voteMagnitude',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'getGuardianAddress',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'getStakingAddress',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'getServiceProviderFactoryAddress',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'getDelegateManagerAddress',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'getVotingPeriod',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'getVotingQuorumPercent',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'getRegistryAddress',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'isGovernanceAddress',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool'
      }
    ],
    payable: false,
    stateMutability: 'pure',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'getMaxInProgressProposals',
    outputs: [
      {
        internalType: 'uint16',
        name: '',
        type: 'uint16'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'getExecutionDelay',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'getInProgressProposals',
    outputs: [
      {
        internalType: 'uint256[]',
        name: '',
        type: 'uint256[]'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'inProgressProposalsAreUpToDate',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
] as const
