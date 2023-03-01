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
      .get(`${window.location.origin}/storage/nodes-statuses`)
      .then((res) => res.data)
  })

export type KeyAndMd5 = {
  key: string
  md5: string
}
export type EndpointToMd5 = { [endpoint: string]: string }
export const fetchFilesByShardAndHost = async (shard: string, host: string) => {
  return axios
    .get(`${host}/storage/persistent/shard/${shard}?includeMD5s=true`)
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
