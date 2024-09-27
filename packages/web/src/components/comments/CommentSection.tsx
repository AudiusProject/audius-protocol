import { useGetCurrentUserId } from '@audius/common/api'
import { CommentSectionProvider } from '@audius/common/context'
import { ID } from '@audius/common/models'
import { EntityType, TrackCommentsSortMethodEnum } from '@audius/sdk'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { useIsMobile } from 'hooks/useIsMobile'

import {
  queryClient,
  useGetCommentsByTrackId
} from '../../../../common/src/context/comments/tanQueryClient'

import { CommentSectionDesktop } from './CommentSectionDesktop'
import { CommentSectionMobile } from './CommentSectionMobile'

type CommentSectionProps = {
  entityId: ID
  entityType?: EntityType.TRACK
}

export const CommentSection = (props: CommentSectionProps) => {
  const { entityId, entityType } = props
  const isMobile = useIsMobile()
  const { data: currentUserId } = useGetCurrentUserId({})

  useGetCommentsByTrackId({
    trackId: entityId,
    sortMethod: TrackCommentsSortMethodEnum.Top,
    userId: Number(currentUserId)
  })

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <CommentSectionProvider entityId={entityId} entityType={entityType}>
        {isMobile ? <CommentSectionMobile /> : <CommentSectionDesktop />}
      </CommentSectionProvider>
    </QueryClientProvider>
  )
}
