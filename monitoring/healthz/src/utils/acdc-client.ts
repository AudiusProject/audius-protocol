import { Interface, ethers } from 'ethers'
import { useEnvironmentSelection } from '../components/EnvironmentSelector'
import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

// todo: env config
export const EM_ADDRESS = '0x1cd8a543596d499b9b6e7a6ec15ecd2b7857fd64'

export function useEthersProvider() {
  const [env] = useEnvironmentSelection()
  const isProd = useLocation().pathname.indexOf('/prod') == 0
  const rpcEndpoint = isProd
    ? 'https://acdc-gateway.audius.co'
    : 'https://acdc-gateway.staging.audius.co'

  return useMemo(() => {
    return new ethers.JsonRpcProvider(rpcEndpoint, undefined, {
      // lua script doesn't handle multiple RPCs in one request atm
      batchMaxSize: 1,
    })
  }, [rpcEndpoint])
}

export function useSomeDiscoveryEndpoint() {
  const isProd = useLocation().pathname.indexOf('/prod') == 0
  return isProd
    ? 'https://discoveryprovider.audius.co'
    : 'https://discoveryprovider.staging.audius.co'
}

export function useSomeContentEndpoint() {
  const isProd = useLocation().pathname.indexOf('/prod') == 0
  return isProd
    ? 'https://creatornode2.audius.co'
    : 'https://creatornode12.staging.audius.co'
}

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
