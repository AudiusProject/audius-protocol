import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import {
  EnvironmentSlector,
  useEnvironmentSelection,
} from './components/EnvironmentSlector'
import { fetchUrl } from './query'
import { SP, useServiceProviders } from './useServiceProviders'

export function DMs() {
  const [env, nodeType] = useEnvironmentSelection()
  const { data: sps, error } = useServiceProviders(env, nodeType)

  if (!sps) return null

  return (
    <div>
      <EnvironmentSlector />
      <h1>DMs</h1>
      <table className="table">
        <thead>
          <tr>
            <th>Host</th>
            <th>Server</th>
            <th>Websocket</th>
            <th>Ver</th>
            <th>Wallet</th>
          </tr>
        </thead>
        <tbody>
          {sps.map((sp) => (
            <DMRow key={sp.endpoint} sp={sp} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DMRow({ sp }: { sp: SP }) {
  const { data: health } = useQuery([`${sp.endpoint}/health_check`], fetchUrl)

  const [wsResult, setWsResult] = useState('')

  useEffect(() => {
    const endpoint = `${sp.endpoint.replace('https', 'wss')}/comms/debug/ws`
    const webSocket = new WebSocket(endpoint)
    // webSocket.onclose = (ev) => {
    //   console.log(ev)
    //   setWsResult('closed')
    // }
    webSocket.onerror = (ev) => {
      console.log('err', ev)
      setWsResult('error')
    }
    webSocket.onopen = (ev) => {
      console.log('OPEN', ev)
      setWsResult('OK')
    }
  }, [])

  const sidecarRoute = `/comms`
  const { data: sidecarStatus } = useQuery(
    [sp.endpoint, sidecarRoute],
    async () => {
      try {
        const resp = await fetch(sp.endpoint + sidecarRoute)
        return resp.status
      } catch (e: any) {
        console.log(e.message)
        return e.message
      }
    }
  )

  return (
    <tr>
      <td>
        <a href={`${sp.endpoint}/comms`} target="_blank">
          {sp.endpoint}
        </a>
      </td>
      <td>
        <b style={{ color: sidecarStatus == 200 ? 'darkgreen' : 'red' }}>
          {sidecarStatus}
        </b>
      </td>
      <td>
        <b style={{ color: wsResult == 'OK' ? 'darkgreen' : 'red' }}>
          {wsResult}
        </b>
      </td>
      <td>{health?.data && <div>{health.data.version}</div>}</td>
      <td>
        <pre style={{ fontSize: '60%' }}>{health?.signer}</pre>
      </td>
    </tr>
  )
}
