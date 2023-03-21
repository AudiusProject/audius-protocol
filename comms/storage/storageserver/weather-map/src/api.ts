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

export const useLogs = (startDateTime: string, endDateTime: string) =>
  useQueries([
    {
      queryKey: ['statusUpdateLogs', startDateTime, endDateTime],
      queryFn: () => fetchStatusUpdateLogs(startDateTime, endDateTime),
      staleTime: Infinity,
    },
    {
      queryKey: ['updateHealthyNodeSetLogs', startDateTime, endDateTime],
      queryFn: () => fetchUpdateHealthyNodeSetLogs(startDateTime, endDateTime),
      staleTime: Infinity,
    },
    {
      queryKey: ['rebalanceLogs', startDateTime, endDateTime],
      queryFn: () => fetchRebalanceLogs(startDateTime, endDateTime),
      staleTime: Infinity,
    },
  ])

const fetchStatusUpdateLogs = (startDateTime: string, endDateTime: string) => {
  return axios
    .get(
      `${window.location.origin}/storage/api/v1/logs/statusUpdate?start=${startDateTime}&end=${endDateTime}`,
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

const fetchRebalanceLogs = (startDateTime: string, endDateTime: string) => {
  return axios
    .get(
      `${window.location.origin}/storage/api/v1/logs/rebalance?start=${startDateTime}&end=${endDateTime}`,
    )
    .then((res) => res.data as RebalanceLogs)
}

export type UpdateHealthyNodeSetLog = {
  timestamp: string
  healthyNodes: string[]
  updatedBy: string
}
const fetchUpdateHealthyNodeSetLogs = (startDateTime: string, endDateTime: string) => {
  return axios
    .get(
      `${window.location.origin}/storage/api/v1/logs/updateHealthyNodeSet?start=${startDateTime}&end=${endDateTime}`,
    )
    .then((res) => res.data as UpdateHealthyNodeSetLog[])
}
