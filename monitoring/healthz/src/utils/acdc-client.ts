import { Interface, ethers } from 'ethers'

// todo: env config
export const ACDC_URL = 'https://acdc-gateway.audius.co'
export const EM_ADDRESS = '0x1cd8a543596d499b9b6e7a6ec15ecd2b7857fd64'

export const provider = new ethers.JsonRpcProvider(ACDC_URL, undefined, {
  // lua script doesn't handle multiple RPCs in one request atm
  batchMaxSize: 1,
})

const iface = new Interface([
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: '_userId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: '_signer',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'string',
        name: '_entityType',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: '_entityId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'string',
        name: '_metadata',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'string',
        name: '_action',
        type: 'string',
      },
    ],
    name: 'ManageEntity',
    type: 'event',
  },
])

export function decodeEmLog(data: string) {
  return iface.decodeEventLog('ManageEntity', data)
}
