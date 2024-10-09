import { CommentSectionProvider } from '@audius/common/context'
import { ID } from '@audius/common/models'
import { EntityType } from '@audius/sdk'

import { useIsMobile } from 'hooks/useIsMobile'

import { CommentSectionDesktop } from './CommentSectionDesktop'
import { CommentSectionMobile } from './CommentSectionMobile'

type CommentSectionProps = {
  entityId: ID
  entityType?: EntityType.TRACK
  commentSectionRef?: React.RefObject<HTMLDivElement>
}

export const CommentSection = (props: CommentSectionProps) => {
  const { entityId, entityType, commentSectionRef } = props
  const isMobile = useIsMobile()

  return (
    <CommentSectionProvider entityId={entityId} entityType={entityType}>
      {isMobile ? (
        <CommentSectionMobile />
      ) : (
        <CommentSectionDesktop commentSectionRef={commentSectionRef!} />
      )}
    </CommentSectionProvider>
  )
}
