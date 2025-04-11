import { Id, type BlobInfo } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'
import { DownloadQuality } from '~/models'
import { ID } from '~/models/Identifiers'

import { QUERY_KEYS } from './queryKeys'

type FileSizeResponse = {
  [trackId: ID]: {
    [k in DownloadQuality]?: number | null
  }
}

type UseFileSizesProps = {
  trackIds: ID[]
  downloadQuality: DownloadQuality
}

/**
 * Returns file sizes for given track ids and download quality (mp3 vs lossless)
 */
export const useFileSizes = ({
  trackIds,
  downloadQuality
}: UseFileSizesProps) => {
  const { audiusSdk } = useAudiusQueryContext()

  return useQuery({
    queryKey: [QUERY_KEYS.FILE_SIZES, { trackIds, downloadQuality }],
    queryFn: async () => {
      const sdk = await audiusSdk()
      const res = await sdk.tracks.inspectTracks({
        id: trackIds.map((trackId) => Id.parse(trackId)),
        original: downloadQuality === DownloadQuality.ORIGINAL
      })

      return (res?.data ?? []).reduce<FileSizeResponse>(
        (acc, blobInfo: BlobInfo, index: number) => {
          const trackId = trackIds[index]
          acc[trackId] = {
            [downloadQuality]: blobInfo?.size ?? null
          }
          return acc
        },
        {}
      )
    },
    enabled: trackIds.length > 0
  })
}
