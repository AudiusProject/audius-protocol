import axios from 'axios'
import { useQueries, useQuery, UseQueryOptions } from 'react-query'

export type HostAndShards = {
  host: string
  shards: string[]
}
export const useNodesToShards = () =>
  useQuery<{ [pubKey: string]: HostAndShards }, any>('nodesToShards', () => {
    return axios
      .get('http://localhost:9924/storage/nodes-to-shards')
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
