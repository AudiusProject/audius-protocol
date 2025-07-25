export const abi = [
  {
    constant: true,
    inputs: [
      {
        name: '',
        type: 'bytes32'
      }
    ],
    name: 'usedSignatures',
    outputs: [
      {
        name: '',
        type: 'bool'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: '_userId',
        type: 'uint256'
      },
      {
        indexed: false,
        name: '_signer',
        type: 'address'
      },
      {
        indexed: false,
        name: '_entityType',
        type: 'string'
      },
      {
        indexed: false,
        name: '_entityId',
        type: 'uint256'
      },
      {
        indexed: false,
        name: '_metadata',
        type: 'string'
      },
      {
        indexed: false,
        name: '_action',
        type: 'string'
      }
    ],
    name: 'ManageEntity',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: '_userId',
        type: 'uint256'
      },
      {
        indexed: false,
        name: '_isVerified',
        type: 'bool'
      }
    ],
    name: 'ManageIsVerified',
    type: 'event'
  },
  {
    constant: false,
    inputs: [
      {
        name: 'name',
        type: 'string'
      },
      {
        name: 'version',
        type: 'string'
      },
      {
        name: 'chainId',
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
        name: '_verifierAddress',
        type: 'address'
      },
      {
        name: '_networkId',
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
        name: '_userId',
        type: 'uint256'
      },
      {
        name: '_entityType',
        type: 'string'
      },
      {
        name: '_entityId',
        type: 'uint256'
      },
      {
        name: '_action',
        type: 'string'
      },
      {
        name: '_metadata',
        type: 'string'
      },
      {
        name: '_nonce',
        type: 'bytes32'
      },
      {
        name: '_subjectSig',
        type: 'bytes'
      }
    ],
    name: 'manageEntity',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        name: '_userId',
        type: 'uint256'
      },
      {
        name: '_isVerified',
        type: 'bool'
      }
    ],
    name: 'manageIsVerified',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const
