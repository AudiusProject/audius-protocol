import { useQuery } from '@tanstack/react-query'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  EM_ADDRESS,
  decodeEmLog,
  useEthersProvider,
  useSomeDiscoveryEndpoint,
} from '../utils/acdc-client'

export function TxViewer() {
  const location = useLocation()
  const navigate = useNavigate()
  const discoveryEndpoint = useSomeDiscoveryEndpoint()
  const provider = useEthersProvider()

  const { data, isLoading } = useQuery(
    [location.pathname],
    async ({ queryKey }) => {
      const latestBlock = await provider.getBlockNumber()
      const logs: any[] = await provider.getLogs({
        fromBlock: latestBlock - 10000,
        address: EM_ADDRESS,
      })

      logs.reverse()
      return { latestBlock, logs }
    }
  )

  if (isLoading || !data) return <div>loading</div>
  const { latestBlock, logs } = data

  const isProd = location.pathname.indexOf('/prod') == 0
  function toggleStaging() {
    if (isProd) {
      navigate(location.pathname.replace('prod', 'stage'))
    } else {
      navigate(location.pathname.replace('stage', 'prod'))
    }
  }

  return (
    <div className="nice">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ flexGrow: 1 }}>
          <h2>Recent Transactions</h2>
          <p>Latest Block: {latestBlock.toString()} </p>
        </div>

        <label onClick={toggleStaging}>
          <input type="checkbox" checked={!isProd} style={{ marginRight: 5 }} />
          staging
        </label>
      </div>

      <table className="niceTable mt-4">
        <thead>
          <tr>
            <th>block no</th>
            <th>tx hash</th>
            <th>signed by</th>
            <th>user id</th>
            <th>action</th>
            <th>type</th>
            <th>id</th>
            <th>metadata</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, idx) => {
            const em = decodeEmLog(log.data)
            return (
              <tr key={idx} onClick={() => console.log(log, em)}>
                <td>{log.blockNumber.toString()}</td>
                <td>
                  <Link
                    className="text-blue-500 underline"
                    to={`tx/${log.transactionHash}`}
                  >
                    {log.transactionHash.substring(0, 15)}...
                  </Link>
                </td>
                <td>
                  <div className="text-xs">
                    <a
                      href={`${discoveryEndpoint}/users/account?wallet=${em._signer}`}
                      target="_blank"
                    >
                      {em._signer}
                    </a>
                  </div>
                </td>
                <td>
                  <a
                    href={`${discoveryEndpoint}/users?id=${em._userId.toString()}`}
                    target="_blank"
                  >
                    {em._userId.toString()}
                  </a>
                </td>
                <td>{em._action}</td>
                <td>{em._entityType}</td>
                <td>{em._entityId.toString()}</td>
                <td>
                  <pre className="text-xs">{em._metadata}</pre>
                </td>
                <td>{em._signer}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <button className="p-4 rounded bg-purple-800 text-white">Older</button>
    </div>
  )
}
