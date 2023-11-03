import { AudiusABIDecoder } from '@audius/sdk/dist/web-libs'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Web3 } from 'web3'

// todo: should be env specific
const web3 = new Web3('https://acdc-gateway.audius.co/')
const EM_ADDRESS = '0x1cd8a543596d499b9b6e7a6ec15ecd2b7857fd64'
const DISCOVERY = 'https://discoveryprovider.audius.co'

export function TxViewer() {
  const { data, isLoading } = useQuery([], async ({ queryKey }) => {
    const latestBlock = await web3.eth.getBlock()
    const logs: any[] = await web3.eth.getPastLogs({
      fromBlock: latestBlock.number - BigInt(10000),
      address: EM_ADDRESS,
    })

    logs.reverse()
    const logsDecoded = AudiusABIDecoder.decodeLogs('EntityManager', logs)
    return { latestBlock, logs, logsDecoded }
  })

  if (isLoading || !data) return <div>loading</div>
  const { latestBlock, logs, logsDecoded } = data

  if (logs.length !== logsDecoded.length) {
    throw new Error(`raw logs and decoded logs have diff length`)
  }

  return (
    <div className="nice">
      <h2>Recent Transactions</h2>
      <p>Latest Block: {latestBlock.number.toString()} </p>

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
            const decoded = logsDecoded[idx]
            const em = abiParamsToObject(decoded.events)
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
                    href={`${DISCOVERY}/users?id=${em._userId}`}
                    target="_blank"
                  >
                    {em._userId}
                  </a>
                </td>
                <td>{em._action}</td>
                <td>{em._entityType}</td>
                <td>{em._entityId}</td>
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

export function abiParamsToObject(params: any[]) {
  const result: Record<string, string> = {}
  for (const param of params) {
    if (!param.value) continue
    result[param.name] = param.value
  }
  return result
}
