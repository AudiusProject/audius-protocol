export const abi = [
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
        internalType: 'uint256',
        name: '_serviceTypeMin',
        type: 'uint256'
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: '_serviceTypeMax',
        type: 'uint256'
      }
    ],
    name: 'ServiceTypeAdded',
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
      }
    ],
    name: 'ServiceTypeRemoved',
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
        internalType: 'bytes32',
        name: '_serviceVersion',
        type: 'bytes32'
      }
    ],
    name: 'SetServiceVersion',
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
      }
    ],
    name: 'initialize',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
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
        internalType: 'bytes32',
        name: '_serviceType',
        type: 'bytes32'
      },
      {
        internalType: 'uint256',
        name: '_serviceTypeMin',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: '_serviceTypeMax',
        type: 'uint256'
      }
    ],
    name: 'addServiceType',
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
      }
    ],
    name: 'removeServiceType',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
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
    name: 'getServiceTypeInfo',
    outputs: [
      {
        internalType: 'bool',
        name: 'isValid',
        type: 'bool'
      },
      {
        internalType: 'uint256',
        name: 'minStake',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'maxStake',
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
    name: 'getValidServiceTypes',
    outputs: [
      {
        internalType: 'bytes32[]',
        name: '',
        type: 'bytes32[]'
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
    name: 'serviceTypeIsValid',
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
        internalType: 'bytes32',
        name: '_serviceVersion',
        type: 'bytes32'
      }
    ],
    name: 'setServiceVersion',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
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
        name: '_versionIndex',
        type: 'uint256'
      }
    ],
    name: 'getVersion',
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
        internalType: 'bytes32',
        name: '_serviceType',
        type: 'bytes32'
      }
    ],
    name: 'getCurrentVersion',
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
        internalType: 'bytes32',
        name: '_serviceType',
        type: 'bytes32'
      }
    ],
    name: 'getNumberOfVersions',
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
      },
      {
        internalType: 'bytes32',
        name: '_serviceVersion',
        type: 'bytes32'
      }
    ],
    name: 'serviceVersionIsValid',
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
