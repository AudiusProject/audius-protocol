import axios from 'axios'
import { useQueries, useQuery, UseQueryOptions } from 'react-query'

export type NodeStatus = {
  host: string
  lastOk: string
  shards: string[]
}
export const useNodeStatuses = () =>
  useQuery<{ [pubKey: string]: NodeStatus }, any>('nodeStatuses', () => {
    return axios
      .get(`${window.location.origin}/storage/api/v1/node-statuses`)
      .then((res) => res.data)
  })

export type KeyAndMd5 = {
  key: string
  md5: string
}
export type EndpointToMd5 = { [endpoint: string]: string }
export const fetchFilesByShardAndHost = async (shard: string, host: string) => {
  return axios
    .get(`${host}/storage/api/v1/persistent/shard/${shard}?includeMD5s=true`)
    .then((res) => {
      return { storageHost: host, files: res.data as KeyAndMd5[] }
    })
}
export const useFilesInShard = (shard: string, storageHostsWithShard: string[]) =>
  useQueries(
    storageHostsWithShard.map<
      UseQueryOptions<{ storageHost: string; files: KeyAndMd5[] }, any>
    >((host) => {
      return {
        queryKey: ['keysAndMd5s', shard, host],
        queryFn: () => fetchFilesByShardAndHost(shard, host),
      }
    }),
  )

export const useLogs = (entries: number, numHoursAgo: number) =>
  useQueries([
    {
      queryKey: ['statusUpdateLogs', entries, numHoursAgo],
      queryFn: () => fetchStatusUpdateLogs(entries, numHoursAgo),
      staleTime: Infinity,
    },
    {
      queryKey: ['updateHealthyNodeSetLogs', entries, numHoursAgo],
      queryFn: () => fetchUpdateHealthyNodeSetLogs(entries, numHoursAgo),
      staleTime: Infinity,
    },
    {
      queryKey: ['rebalanceLogs', entries, numHoursAgo],
      queryFn: () => fetchRebalanceLogs(entries, numHoursAgo),
      staleTime: Infinity,
    },
  ])

const fetchStatusUpdateLogs = (entries: number, numHoursAgo: number) => {
  return axios
    .get(
      `${window.location.origin}/storage/api/v1/logs/statusUpdate?numEntries=${entries}&numHoursAgo=${numHoursAgo}`,
    )
    .then((res) => res.data as NodeStatus[])
}

type RebalanceStartLog = {
  timestamp: string
  prevShards: string[]
  newShards: string[]
}
type RebalanceEndLog = {
  timestamp: string
  prevShards: string[]
  newShards: string[]
  // TODO: Time spent, numFiles per shard, etc...
}
type StartEventsForHost = {
  host: string
  events: RebalanceStartLog[]
}
type EndEventsForHost = {
  host: string
  events: RebalanceEndLog[]
}
export type RebalanceLogs = {
  starts: StartEventsForHost[]
  ends: EndEventsForHost[]
}

const fetchRebalanceLogs = (entries: number, numHoursAgo: number) => {
  return axios
    .get(
      `${window.location.origin}/storage/api/v1/logs/rebalance?numEntries=${entries}&numHoursAgo=${numHoursAgo}`,
    )
    .then((res) => res.data as RebalanceLogs)
}

export type UpdateHealthyNodeSetLog = {
  timestamp: string
  healthyNodes: string[]
  updatedBy: string
}
const fetchUpdateHealthyNodeSetLogs = (entries: number, numHoursAgo: number) => {
  return axios
    .get(
      `${window.location.origin}/storage/api/v1/logs/updateHealthyNodeSet?numEntries=${entries}&numHoursAgo=${numHoursAgo}`,
    )
    .then((res) => res.data as UpdateHealthyNodeSetLog[])
}
