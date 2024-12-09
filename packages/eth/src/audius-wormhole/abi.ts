export const abi = [
  {
    constant: true,
    inputs: [],
    name: 'DOMAIN_SEPARATOR',
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
    inputs: [],
    name: 'TRANSFER_TOKENS_TYPEHASH',
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
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    name: 'nonces',
    outputs: [
      {
        internalType: 'uint32',
        name: '',
        type: 'uint32'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'token',
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
        name: '_tokenAddress',
        type: 'address'
      },
      {
        internalType: 'address',
        name: '_wormholeAddress',
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
        internalType: 'address',
        name: 'from',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      },
      {
        internalType: 'uint16',
        name: 'recipientChain',
        type: 'uint16'
      },
      {
        internalType: 'bytes32',
        name: 'recipient',
        type: 'bytes32'
      },
      {
        internalType: 'uint256',
        name: 'arbiterFee',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'deadline',
        type: 'uint256'
      },
      {
        internalType: 'uint8',
        name: 'v',
        type: 'uint8'
      },
      {
        internalType: 'bytes32',
        name: 'r',
        type: 'bytes32'
      },
      {
        internalType: 'bytes32',
        name: 's',
        type: 'bytes32'
      }
    ],
    name: 'transferTokens',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const
