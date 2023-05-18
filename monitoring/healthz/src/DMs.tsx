import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import {
  EnvironmentSelector,
  useEnvironmentSelection,
} from './components/EnvironmentSelector'
import { fetchUrl } from './query'
import { SP, useServiceProviders } from './useServiceProviders'
import { RelTime } from './misc'

export function DMs() {
  const [env, nodeType] = useEnvironmentSelection()
  const { data: sps, error } = useServiceProviders(env, nodeType)

  if (!sps) return null

  return (
    <div style={{ padding: 20 }}>
      <EnvironmentSelector />
      <h1>DMs</h1>
      <table className="table">
        <thead>
          <tr>
            <th>Host</th>
            <th>Ver</th>
            <th>Comms Tag</th>
            <th>Boot Time</th>
            <th>Websocket</th>
            <th>Lasted</th>
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
    <tr>
      <td>
        <div>
          <a href={`${sp.endpoint}/comms`} target="_blank">
            {sp.endpoint}
          </a>
        </div>
      </td>
      <td>{health?.data && <div>{health.data.version}</div>}</td>
      <td>
        {commsStatus?.error && (
          <span style={{ color: 'red' }}>{commsStatus.error}</span>
        )}
        {commsStatus?.commit && (
          <>
            <a
              href={`https://github.com/AudiusProject/audius-protocol/commits/${commsStatus.commit}/comms`}
              target="_blank"
              title={`built: ${new Date(commsStatus.built).toLocaleString()}`}
            >
              {commsStatus.commit.substring(0, 8)}{' '}
            </a>
          </>
        )}
      </td>
      <td>
        {commsStatus?.booted && (
          <>
            <RelTime date={commsStatus.booted} />
          </>
        )}
      </td>
      <td>
        <b
          style={{
            color: wsResult == 'OK' ? 'darkgreen' : 'red',
          }}
        >
          {wsResult}
        </b>
        <small style={{ marginLeft: 20, color: 'darkgreen' }}>
          {connectedAt?.toLocaleTimeString()}
        </small>
        <small style={{ marginLeft: 20, color: 'red' }}>
          {disconnectedAt?.toLocaleTimeString()}
        </small>
      </td>
      <td>{timeDiffInSeconds(connectedAt, disconnectedAt)}</td>
    </tr>
  )
}

function timeDiffInSeconds(start: Date | undefined, end: Date | undefined) {
  if (start && end && end.getTime() > start.getTime()) {
    return `${(end.getTime() - start.getTime()) / 1000}s`
  }
  return ''
}
