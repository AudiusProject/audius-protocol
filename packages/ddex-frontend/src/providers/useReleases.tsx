import { useQuery } from '@tanstack/react-query'

export type ReleaseRowData = {
  title: string
  genre: string
  releaseDate: Date
  isUnlisted: boolean
  isPremium: boolean
  description: string
  license: string
  userId: string
  artistName: string
  fieldVisibility: {
    genre: boolean
    mood: boolean
    tags: boolean
    share: boolean
    play_count: boolean
    remixes: boolean
  }
}

export type ReleaseRow = {
  id: number
  from_xml_file?: number // Reference to XmlFileRow.id
  release_date: Date
  data: ReleaseRowData
  status: string
}

type ReleasesResponse = {
  releases: ReleaseRow[]
  hasMoreNext: boolean
  hasMorePrev: boolean
}

const useReleases = (statusFilter = '', nextCursor = '', prevCursor = '') => {
  return useQuery<ReleasesResponse>({
    queryKey: ['releases', statusFilter, nextCursor, prevCursor],
    queryFn: async () => {
      const params = new URLSearchParams({ status: statusFilter })
      if (nextCursor) {
        params.append('nextCursor', nextCursor)
      } else if (prevCursor) {
        params.append('prevCursor', prevCursor)
      }
      const response = await fetch(`/api/releases?${params.toString()}`)
      if (!response.ok) {
        throw new Error(
          `Failed fetching releases: ${response.status} ${response.statusText}`
        )
      }
      const data = (await response.json()) as ReleasesResponse

      return {
        ...data,
        releases: data.releases.map((release) => ({
          ...release,
          release_date: new Date(release.release_date),
          data: {
            ...JSON.parse(release.data as unknown as string),
            releaseDate: new Date(release.data.releaseDate),
          },
        })),
      }
    },
  })
}

export default useReleases
