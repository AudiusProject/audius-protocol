import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useEnvironmentSelection } from '../components/EnvironmentSelector'
import { fetchUrl } from '../query'
import { SP, useServiceProviders } from '../useServiceProviders'
import { RelTime } from '../misc'

export function DMs() {
  const [env, nodeType] = useEnvironmentSelection()
  const { data: sps, error } = useServiceProviders(env, nodeType)

  if (!sps) return null

  return (
    <div className="p-5 mt-8 dark:bg-gray-800">
      <div className="overflow-x-auto">
        <table className="table-auto w-full border-collapse border dark:border-gray-700">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700">
              <th className="p-2 border dark:border-gray-600">Host</th>
              <th className="p-2 border dark:border-gray-600">Ver</th>
              <th className="p-2 border dark:border-gray-600">Boot Time</th>
              <th className="p-2 border dark:border-gray-600">Host Config</th>
              <th className="p-2 border dark:border-gray-600">Wallet</th>
              <th className="p-2 border dark:border-gray-600">Healthy</th>
              <th className="p-2 border dark:border-gray-600">Websocket</th>
              <th className="p-2 border dark:border-gray-600">Lasted</th>
            </tr>
          </thead>
          <tbody>
            {sps.map((sp) => (
              <DMRow key={sp.endpoint} sp={sp} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DMRow({ sp }: { sp: SP }) {
  const { data: health } = useQuery([`${sp.endpoint}/health_check`], fetchUrl)

  const [wsResult, setWsResult] = useState('')
  const [connectedAt, setConnectedAt] = useState<Date>()
  const [disconnectedAt, setDisonnectedAt] = useState<Date>()

  useEffect(() => {
    const endpoint = `${sp.endpoint.replace('https', 'wss')}/comms/debug/ws`
    const webSocket = new WebSocket(endpoint)
    webSocket.onclose = (ev) => {
      console.log(ev)
      if (wsResult == 'OK') {
        setWsResult('closed')
      }
      setDisonnectedAt(new Date())
    }
    webSocket.onerror = (ev) => {
      console.log('err', ev)
      setWsResult('error')
    }
    webSocket.onopen = (ev) => {
      console.log('OPEN', ev)
      setWsResult('OK')
      setConnectedAt(new Date())
      setDisonnectedAt(undefined)
    }
  }, [])

  const sidecarRoute = `/comms`
  const { data: commsStatus } = useQuery(
    [sp.endpoint, sidecarRoute],
    async () => {
      try {
        const resp = await fetch(sp.endpoint + sidecarRoute)
        const data = await resp.json()
        return data
      } catch (e: any) {
        console.log(e.message)
        return { error: e.message }
      }
    }
  )

  return (
    <tr className="hover:bg-gray-100 dark:hover:bg-gray-700">
      <td className="p-2 border dark:border-gray-600">
        <a href={`${sp.endpoint}/comms`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline dark:text-blue-400">
          {sp.endpoint}
        </a>
      </td>
      <td className="p-2 border dark:border-gray-600">{health?.data && <div className="dark:text-gray-300">{health.data.version}</div>}</td>
      <td className="p-2 border dark:border-gray-600 dark:text-gray-300">{commsStatus?.booted && <RelTime date={commsStatus.booted} />}</td>
      <td className="p-2 border dark:border-gray-600 dark:text-gray-300">{commsStatus?.host}</td>
      <td className="p-2 border dark:border-gray-600 dark:text-gray-300">{commsStatus?.wallet}</td>
      <td className={`p-2 border ${commsStatus?.healthy ? 'text-green-600' : 'text-red-600'}`}>
        {commsStatus?.healthy ? 'yes' : 'no'}
      </td>
      <td className="p-2 border">
        <b className={`font-bold ${wsResult === 'OK' ? 'text-green-600' : 'text-red-600'}`}>{wsResult}</b>
        <small className="ml-5 text-green-600">{connectedAt?.toLocaleTimeString()}</small>
        <small className="ml-5 text-red-600">{disconnectedAt?.toLocaleTimeString()}</small>
      </td>
      <td className="p-2 border dark:border-gray-600 dark:text-gray-300">{timeDiffInSeconds(connectedAt, disconnectedAt)}</td>
    </tr>
  )
}

function timeDiffInSeconds(start: Date | undefined, end: Date | undefined) {
  if (start && end && end.getTime() > start.getTime()) {
    return `${(end.getTime() - start.getTime()) / 1000}s`
  }
  return ''
}
