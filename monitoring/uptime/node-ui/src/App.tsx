import { useState } from 'react'
import { useBlockNumber, useAccount, useConnect, useDisconnect } from 'wagmi'
import { useEnvVars } from './providers/EnvVarsProvider'
import { useAudiusLibs } from './providers/AudiusLibsProvider'
import useMinChainVersions from './hooks/useMinChainVersions'
import useLatestGitHubVersions from './hooks/useLatestGitHubVersions'
import Header from './Header'
import Uptime from './Uptime'
import NetworkOverview from './NetworkOverview'

const App = () => {
  const { endpoint, env, nodeType } = useEnvVars()
  const {
    audiusLibs,
    isLoading: isAudiusLibsLoading,
    isReadOnly: isLibsReadOnly
  } = useAudiusLibs()
  const {
    data: minChainVersions,
    isPending: isMinChainVersionsPending,
    error: minChainVersionsError
  } = useMinChainVersions()
  const {
    data: latestGithubVersions,
    isPending: isLatestGithubVersionsPending,
    error: latestGithubVersionsError
  } = useLatestGitHubVersions()

  const { address, chain } = useAccount()
  const { data: latestBlockNumber } = useBlockNumber()

  const { connectors, connect } = useConnect()
  const { disconnect } = useDisconnect()

  return (
    <>
      <Header />
      <div className="pageContainer">
        <div className="pageContentContainer">
          <div>
            <p>Host: {endpoint}</p>
            <p>Environment: {env}</p>
            <p>Node Type: {nodeType}</p>
            <p>
              Min enforceable versions (chain):{' '}
              {isMinChainVersionsPending
                ? 'loading...'
                : minChainVersionsError
                ? 'error'
                : JSON.stringify(minChainVersions)}
            </p>
            <p>
              Latest versions (GitHub):{' '}
              {isLatestGithubVersionsPending
                ? 'loading...'
                : latestGithubVersionsError
                ? 'error'
                : JSON.stringify(latestGithubVersions)}
            </p>
            <p>
              MetaMask connected to chain:{' '}
              {chain?.name
                ? `${chain.name} (latest block: ${(
                    latestBlockNumber ?? ''
                  ).toString()}. if this number is wrong, your
              RPC env var is not configured to talk to this chain)`
                : '?'}
            </p>
            <p>
              Libs:{' '}
              {isAudiusLibsLoading
                ? 'loading...'
                : `v${audiusLibs!.version} (${
                    isLibsReadOnly ? 'read-only' : 'able to sign txns'
                  })`}
            </p>

            {connectors.map((connector) => (
              <button class="btn btn-blue" key={connector.uid} onClick={() => connect({ connector })}>
                Connect {connector.name}
              </button>
            ))}

            {
              <div>
                {address && <div>{address}</div>}
                {address && <button onClick={() => disconnect()}>Disconnect</button>}
              </div>
            }
          </div>
          <Uptime />
          <NetworkOverview />
        </div>
      </div>
    </>
  )
}

export default App
