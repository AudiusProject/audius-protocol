export const abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: '_newClaimsManagerAddress',
        type: 'address'
      }
    ],
    name: 'ClaimsManagerAddressUpdated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: '_lockupDuration',
        type: 'uint256'
      }
    ],
    name: 'DecreaseStakeLockupDurationUpdated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: '_owner',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: '_decreaseAmount',
        type: 'uint256'
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: '_lockupExpiryBlock',
        type: 'uint256'
      }
    ],
    name: 'DecreaseStakeRequestCancelled',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: '_owner',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: '_decreaseAmount',
        type: 'uint256'
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: '_newStakeAmount',
        type: 'uint256'
      }
    ],
    name: 'DecreaseStakeRequestEvaluated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: '_owner',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: '_decreaseAmount',
        type: 'uint256'
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: '_lockupExpiryBlock',
        type: 'uint256'
      }
    ],
    name: 'DecreaseStakeRequested',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: '_newDelegateManagerAddress',
        type: 'address'
      }
    ],
    name: 'DelegateManagerAddressUpdated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: '_owner',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: '_serviceType',
        type: 'bytes32'
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: '_spID',
        type: 'uint256'
      },
      {
        indexed: false,
        internalType: 'address',
        name: '_updatedWallet',
        type: 'address'
      }
    ],
    name: 'DelegateOwnerWalletUpdated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: '_owner',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: '_requestedCut',
        type: 'uint256'
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: '_finalCut',
        type: 'uint256'
      }
    ],
    name: 'DeployerCutUpdateRequestCancelled',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: '_owner',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: '_updatedCut',
        type: 'uint256'
      }
    ],
    name: 'DeployerCutUpdateRequestEvaluated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: '_owner',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: '_updatedCut',
        type: 'uint256'
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: '_lockupExpiryBlock',
        type: 'uint256'
      }
    ],
    name: 'DeployerCutUpdateRequested',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: '_spID',
        type: 'uint256'
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: '_serviceType',
        type: 'bytes32'
      },
      {
        indexed: true,
        internalType: 'address',
        name: '_owner',
        type: 'address'
      },
      {
        indexed: false,
        internalType: 'string',
        name: '_endpoint',
        type: 'string'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: '_unstakeAmount',
        type: 'uint256'
      }
    ],
    name: 'DeregisteredServiceProvider',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: '_serviceType',
        type: 'bytes32'
      },
      {
        indexed: true,
        internalType: 'address',
        name: '_owner',
        type: 'address'
      },
      {
        indexed: false,
        internalType: 'string',
        name: '_oldEndpoint',
        type: 'string'
      },
      {
        indexed: false,
        internalType: 'string',
        name: '_newEndpoint',
        type: 'string'
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: '_spID',
        type: 'uint256'
      }
    ],
    name: 'EndpointUpdated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: '_newGovernanceAddress',
        type: 'address'
      }
    ],
    name: 'GovernanceAddressUpdated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: '_owner',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: '_increaseAmount',
        type: 'uint256'
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: '_newStakeAmount',
        type: 'uint256'
      }
    ],
    name: 'IncreasedStake',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: '_spID',
        type: 'uint256'
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: '_serviceType',
        type: 'bytes32'
      },
      {
        indexed: true,
        internalType: 'address',
        name: '_owner',
        type: 'address'
      },
      {
        indexed: false,
        internalType: 'string',
        name: '_endpoint',
        type: 'string'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: '_stakeAmount',
        type: 'uint256'
      }
    ],
    name: 'RegisteredServiceProvider',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: '_newServiceTypeManagerAddress',
        type: 'address'
      }
    ],
    name: 'ServiceTypeManagerAddressUpdated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: '_newStakingAddress',
        type: 'address'
      }
    ],
    name: 'StakingAddressUpdated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: '_lockupDuration',
        type: 'uint256'
      }
    ],
    name: 'UpdateDeployerCutLockupDurationUpdated',
    type: 'event'
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
        internalType: 'address',
        name: '_governanceAddress',
        type: 'address'
      },
      {
        internalType: 'address',
        name: '_claimsManagerAddress',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: '_decreaseStakeLockupDuration',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: '_deployerCutLockupDuration',
        type: 'uint256'
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
    inputs: [
      {
        internalType: 'bytes32',
        name: '_serviceType',
        type: 'bytes32'
      },
      {
        internalType: 'string',
        name: '_endpoint',
        type: 'string'
      },
      {
        internalType: 'uint256',
        name: '_stakeAmount',
        type: 'uint256'
      },
      {
        internalType: 'address',
        name: '_delegateOwnerWallet',
        type: 'address'
      }
    ],
    name: 'register',
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
        internalType: 'bytes32',
        name: '_serviceType',
        type: 'bytes32'
      },
      {
        internalType: 'string',
        name: '_endpoint',
        type: 'string'
      }
    ],
    name: 'deregister',
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
        name: '_increaseStakeAmount',
        type: 'uint256'
      }
    ],
    name: 'increaseStake',
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
        name: '_decreaseStakeAmount',
        type: 'uint256'
      }
    ],
    name: 'requestDecreaseStake',
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
        internalType: 'address',
        name: '_account',
        type: 'address'
      }
    ],
    name: 'cancelDecreaseStakeRequest',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [],
    name: 'decreaseStake',
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
        internalType: 'bytes32',
        name: '_serviceType',
        type: 'bytes32'
      },
      {
        internalType: 'string',
        name: '_endpoint',
        type: 'string'
      },
      {
        internalType: 'address',
        name: '_updatedDelegateOwnerWallet',
        type: 'address'
      }
    ],
    name: 'updateDelegateOwnerWallet',
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
        name: '_serviceType',
        type: 'bytes32'
      },
      {
        internalType: 'string',
        name: '_oldEndpoint',
        type: 'string'
      },
      {
        internalType: 'string',
        name: '_newEndpoint',
        type: 'string'
      }
    ],
    name: 'updateEndpoint',
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
        internalType: 'address',
        name: '_serviceProvider',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: '_cut',
        type: 'uint256'
      }
    ],
    name: 'requestUpdateDeployerCut',
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
        name: '_serviceProvider',
        type: 'address'
      }
    ],
    name: 'cancelUpdateDeployerCut',
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
        name: '_serviceProvider',
        type: 'address'
      }
    ],
    name: 'updateDeployerCut',
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
        name: '_serviceProvider',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: '_amount',
        type: 'uint256'
      }
    ],
    name: 'updateServiceProviderStake',
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
        name: '_duration',
        type: 'uint256'
      }
    ],
    name: 'updateDecreaseStakeLockupDuration',
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
        name: '_duration',
        type: 'uint256'
      }
    ],
    name: 'updateDeployerCutLockupDuration',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'getServiceProviderDeployerCutBase',
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
    name: 'getDeployerCutLockupDuration',
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
    inputs: [
      {
        internalType: 'bytes32',
        name: '_serviceType',
        type: 'bytes32'
      }
    ],
    name: 'getTotalServiceTypeProviders',
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
    inputs: [
      {
        internalType: 'string',
        name: '_endpoint',
        type: 'string'
      }
    ],
    name: 'getServiceProviderIdFromEndpoint',
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
    inputs: [
      {
        internalType: 'address',
        name: '_ownerAddress',
        type: 'address'
      },
      {
        internalType: 'bytes32',
        name: '_serviceType',
        type: 'bytes32'
      }
    ],
    name: 'getServiceProviderIdsFromAddress',
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
    inputs: [
      {
        internalType: 'bytes32',
        name: '_serviceType',
        type: 'bytes32'
      },
      {
        internalType: 'uint256',
        name: '_serviceId',
        type: 'uint256'
      }
    ],
    name: 'getServiceEndpointInfo',
    outputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address'
      },
      {
        internalType: 'string',
        name: 'endpoint',
        type: 'string'
      },
      {
        internalType: 'uint256',
        name: 'blockNumber',
        type: 'uint256'
      },
      {
        internalType: 'address',
        name: 'delegateOwnerWallet',
        type: 'address'
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
        internalType: 'address',
        name: '_serviceProvider',
        type: 'address'
      }
    ],
    name: 'getServiceProviderDetails',
    outputs: [
      {
        internalType: 'uint256',
        name: 'deployerStake',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'deployerCut',
        type: 'uint256'
      },
      {
        internalType: 'bool',
        name: 'validBounds',
        type: 'bool'
      },
      {
        internalType: 'uint256',
        name: 'numberOfEndpoints',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'minAccountStake',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'maxAccountStake',
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
        internalType: 'address',
        name: '_serviceProvider',
        type: 'address'
      }
    ],
    name: 'getPendingDecreaseStakeRequest',
    outputs: [
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'lockupExpiryBlock',
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
        internalType: 'address',
        name: '_serviceProvider',
        type: 'address'
      }
    ],
    name: 'getPendingUpdateDeployerCutRequest',
    outputs: [
      {
        internalType: 'uint256',
        name: 'newDeployerCut',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'lockupExpiryBlock',
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
    name: 'getDecreaseStakeLockupDuration',
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
    inputs: [
      {
        internalType: 'address',
        name: '_serviceProvider',
        type: 'address'
      }
    ],
    name: 'validateAccountStakeBalance',
    outputs: [],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'getGovernanceAddress',
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
    name: 'getServiceTypeManagerAddress',
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
    name: 'getClaimsManagerAddress',
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
    constant: false,
    inputs: [
      {
        internalType: 'address',
        name: '_governanceAddress',
        type: 'address'
      }
    ],
    name: 'setGovernanceAddress',
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
        name: '_address',
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
        name: '_address',
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
        internalType: 'address',
        name: '_address',
        type: 'address'
      }
    ],
    name: 'setServiceTypeManagerAddress',
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
        name: '_address',
        type: 'address'
      }
    ],
    name: 'setClaimsManagerAddress',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const
