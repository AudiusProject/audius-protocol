import { AudiusABIDecoder } from '@audius/sdk/dist/web-libs'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { EM_ADDRESS, decodeEmLog, provider } from '../utils/acdc-client'

// todo: env config
const DISCOVERY = 'https://discoveryprovider.audius.co'

export function TxViewer() {
  const { data, isLoading } = useQuery([], async ({ queryKey }) => {
    const latestBlock = await provider.getBlockNumber()
    const logs: any[] = await provider.getLogs({
      fromBlock: latestBlock - 10000,
      address: EM_ADDRESS,
    })

    logs.reverse()
    // const logsDecoded = AudiusABIDecoder.decodeLogs('EntityManager', logs)
    return { latestBlock, logs }
  })

  if (isLoading || !data) return <div>loading</div>
  const { latestBlock, logs } = data

  return (
    <div className="nice">
      <h2>Recent Transactions</h2>
      <p>Latest Block: {latestBlock.toString()} </p>

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
                    to={`/explorer/tx/${log.transactionHash}`}
                  >
                    {log.transactionHash.substring(0, 15)}...
                  </Link>
                </td>
                <td>
                  <div className="text-xs">
                    <a
                      href={`${DISCOVERY}/users/account?wallet=${em._signer}`}
                      target="_blank"
                    >
                      {em._signer}
                    </a>
                  </div>
                </td>
                <td>
                  <a
                    href={`${DISCOVERY}/users?id=${em._userId.toString()}`}
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
