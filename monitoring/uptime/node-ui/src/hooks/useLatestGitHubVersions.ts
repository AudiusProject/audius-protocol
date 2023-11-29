import { useQuery } from '@tanstack/react-query'

type VersionResp = {
  version: string
  service: 'content-node' | 'discovery-node'
}

const fetchVersionData = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(
      `Failed fetching version data from ${url}: ${response.status} ${response.statusText}`
    )
  }
  const data = (await response.json()) as VersionResp
  return data
}

const useLatestGitHubVersions = () => {
  return useQuery({
    queryKey: ['githubVersionData'],
    queryFn: async () => {
      const contentNodeUrl =
        'https://raw.githubusercontent.com/AudiusProject/audius-protocol/main/mediorum/.version.json'
      const discoveryNodeUrl =
        'https://raw.githubusercontent.com/AudiusProject/audius-protocol/main/packages/discovery-provider/.version.json'

      const [contentNode, discoveryNode] = await Promise.all([
        fetchVersionData(contentNodeUrl),
        fetchVersionData(discoveryNodeUrl)
      ])

      return {
        'content-node': contentNode.version,
        'discovery-node': discoveryNode.version
      }
    },
    staleTime: Infinity // Never refetch
  })
}

export default useLatestGitHubVersions
