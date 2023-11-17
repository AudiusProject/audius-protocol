import React, { useEffect, useState } from 'react';
import BN from 'bn.js'
import useSWR from 'swr'
import { Card, Title, Tracker, Flex, Text, Color } from "@tremor/react";
import { useEnvVars } from './providers/EnvVarsProvider'
import { useAudiusLibs } from './providers/AudiusLibsProvider'
import type { AudiusLibsContextType } from './providers/AudiusLibsProvider'
import { formatWei } from './helpers'
import useNodes from './hooks/useNodes'
import { UptimeResponse } from './Uptime'

interface NodeResponse {
  blockNumber: number
  delegateOwnerWallet: string
  endpoint: string
  owner: string
  spID: number
  type: string
}

interface Tracker {
  color: Color
  tooltip: string
}

type BigNumber = BN

type ServiceProvider = {
  deployerCut: number
  deployerStake: BigNumber
  maxAccountStake: BigNumber
  minAccountStake: BigNumber
  numberOfEndpoints: number
  validBounds: boolean
}

type GetPendingUndelegateRequestResponse = {
  amount: BigNumber
  lockupExpiryBlock: number
  target: string
}

type User = {
  wallet: string
  totalDelegatorStake: BigNumber
  pendingUndelegateRequest: GetPendingUndelegateRequestResponse
}

// type GetPendingDecreaseStakeRequestResponse = {
//   lockupExpiryBlock: number
//   amount: BigNumber
// }

// type Operator = {
//   serviceProvider: ServiceProvider
//   pendingDecreaseStakeRequest: GetPendingDecreaseStakeRequestResponse
//   delegatedTotal: BigNumber
//   totalStakedFor: BigNumber
// } & User

// const fetcher = (url: string) => fetch(url).then((res) => res.json())

const fetcher = async url => {
  const res = await fetch(url)
 
  // If the status code is not in the range 200-299,
  // we still try to parse and throw it.
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.')
    // Attach extra info to the error object.
    error.info = await res.json()
    error.status = res.status
    throw error
  }
 
  return res.json()
}

const UptimeTracker = ({ data }: { UptimeResponse }) => {
  if (!data?.uptime_raw_data) {
    return null
  }

  const trackerData: Tracker[] = []
  for (const [hour, up] of Object.entries(data?.uptime_raw_data)) {
    const hourString = new Date(hour).toUTCString()
    if (up) {
      trackerData.push({
        color: 'emerald',
        tooltip: `${hourString}: Operational`
      })
    } else {
      trackerData.push({
        color: 'rose',
        tooltip: `${hourString}: Down`
      })
    }
  }

  return (
    <Tracker data={trackerData} className="w-20 mx-auto mt-2" />
  )
}

const getUserMetadata = async (
  wallet: string,
  audiusLibs: AudiusLibsContextType
): Promise<User> => {
  const totalDelegatorStake =
    await audiusLibs.ethContracts.DelegateManagerClient.getTotalDelegatorStake(wallet)
  const pendingUndelegateRequest = await audiusLibs.ethContracts.DelegateManagerClient.getPendingUndelegateRequest(
    wallet
  )

  const user = {
    wallet,
    totalDelegatorStake,
    pendingUndelegateRequest
  }

  return user
}

const getServiceProviderMetadata = async (
  wallet: string,
  audiusLibs: AudiusLibsContextType
) => {
  const totalStakedFor = await audiusLibs.ethContracts.StakingProxyClient.totalStakedFor(wallet)
  const delegatedTotal = await audiusLibs.ethContracts.DelegateManagerClient.getTotalDelegatedToServiceProvider(wallet)
  const serviceProvider: ServiceProvider = await audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceProviderDetails(wallet)
  const pendingDecreaseStakeRequest = await audiusLibs.ethContracts.ServiceProviderFactoryClient.getPendingDecreaseStakeRequest(
    wallet
  )

  return {
    serviceProvider,
    pendingDecreaseStakeRequest,
    totalStakedFor,
    delegatedTotal
  }

}

const NodeRow = ({ node }: { NodeResponse }) => {
  const { audiusLibs } = useAudiusLibs()

  const [bondedData, setBondedData] = useState('')
  const [bondedDataError, setBondedDataError] = useState(false)

  useEffect(() => {
    /**
     * Calculates and returns active stake for address
     *
     * Active stake = (active deployer stake + active delegator stake)
     *      active deployer stake = (direct deployer stake - locked deployer stake)
     *          locked deployer stake = amount of pending decreaseStakeRequest for address
     *      active delegator stake = (total delegator stake - locked delegator stake)
     *          locked delegator stake = amount of pending undelegateRequest for address
     */
    const getActiveStake = async (
      wallet: string,
      audiusLibs: AudiusLibsContextType
    ) => {
      try {
        const user = await getUserMetadata(wallet, audiusLibs)
        const serviceProvider = await getServiceProviderMetadata(
          wallet,
          audiusLibs
        )
        const operator = {
          ...user,
          ...serviceProvider
        }

        let activeDeployerStake: BN = new BN('0')
        let activeDelegatorStake: BN = new BN('0')
        if ('serviceProvider' in operator) {
          const { deployerStake } = operator.serviceProvider
          const { amount: pendingDecreaseStakeAmount, lockupExpiryBlock} =
            operator.pendingDecreaseStakeRequest
          if (lockupExpiryBlock !== 0) {
            activeDeployerStake = deployerStake.sub(pendingDecreaseStakeAmount)
          } else {
            activeDeployerStake = deployerStake
          }
        }

        if (operator.pendingUndelegateRequest.lockupExpiryBlock !== 0) {
          activeDelegatorStake = operator.totalDelegatorStake.sub(
            operator.pendingUndelegateRequest.amount
          )
        } else {
          activeDelegatorStake = operator.totalDelegatorStake
        }
        const activeStake = activeDelegatorStake.add(activeDeployerStake)
        setBondedData(formatWei(activeStake))
      } catch (error) {
        console.error(`Could not fetch bonded $AUDIO for ${wallet}`, error)
        setBondedDataError(true)
      }
    }

    if (node.owner) {
      getActiveStake(node.owner, audiusLibs)
    }
  }, [node, audiusLibs])

  const { data: healthData, error: healthDataError } = useSWR(
    `${node.endpoint}/health_check?enforce_block_diff=true&healthy_block_diff=250&plays_count_max_drift=720`,
    fetcher
  )
  const health = healthData?.data
  const { data: uptimeData, error: uptimeDataError } = useSWR(
    `${node.endpoint}/d_api/uptime?host=${node.endpoint}&durationHours=12`,
    fetcher
  )
  // TODO this metric for content nodes
  const { data: requestsData, error: requestsDataError } = useSWR(
    `${node.endpoint}/v1/metrics/routes/week?bucket_size=day`,
    fetcher
  )
  const requests = requestsData?.data

  return (
    <tr>
      <td className="tableCellFirst">
        <div className="flex items-center justify-center">
          {!healthDataError && !health
            ? 'loading...'
            : healthDataError
            ? 'error'
            : health?.healthy || health?.discovery_provider_healthy
            ? (<span class="flex w-3 h-3 me-3 bg-green-500 rounded-full"></span>)
            : (<span class="flex w-3 h-3 me-3 bg-red-500 rounded-full"></span>
  )
          }
        </div>
      </td>
      <td className="tableCell">
        {!healthDataError && !health
          ? 'loading...'
          : healthDataError 
          ? 'error'
          : health?.version
        }
      </td>
      <td className="tableCell">
        {!uptimeDataError && !uptimeData
          ? 'loading...'
          : uptimeDataError || (uptimeData && !uptimeData.uptime_raw_data)
          ? 'error'
          : <UptimeTracker key={node.endpoint} data={uptimeData} />
        }
      </td>
      <td className="tableCell">{node.endpoint}</td>
      <td className="tableCell">
        {!bondedDataError && !bondedData
          ? 'loading...'
          : bondedDataError
          ? 'error'
          : bondedData
        }
      </td>
      <td className="tableCell"></td>
      <td className="tableCell">
        {!requestsDataError && !requests
          ? 'loading...'
          : requestsDataError
          ? 'error'
          : requests[requests.length - 1].total_count
        }
      </td>
      <td className="tableCell">{node.owner}</td>
    </tr>
  )
}

const NetworkOverview = () => {
  const { nodeType } = useEnvVars()
  const {
    data: nodes,
    isPending: isListNodesPending,
    error: listNodesError
  } = useNodes(nodeType)

  return (
    <>
      {isListNodesPending
        ? 'loading...'
        : listNodesError
        ? 'error'
        : (
          <div className="mt-8 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="tableHeaderCellFirst">
                          Health
                        </th>
                        <th scope="col" className="tableHeaderCell">
                          Version
                        </th>
                        <th scope="col" className="tableHeaderCell">
                          Uptime
                        </th>
                        <th scope="col" className="tableHeaderCell">
                          Host
                        </th>
                        <th scope="col" className="tableHeaderCell">
                          Bond $AUDIO
                        </th>
                        <th scope="col" className="tableHeaderCell">
                          Reward (24h)
                        </th>
                        <th scope="col" className="tableHeaderCell">
                          Requests (24h)
                        </th>
                        <th scope="col" className="tableHeaderCell">
                          Operator
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {(nodes as NodeResponse[]).map((node) => (<NodeRow key={node.endpoint} node={node} />))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </>
  )
}

export default NetworkOverview
