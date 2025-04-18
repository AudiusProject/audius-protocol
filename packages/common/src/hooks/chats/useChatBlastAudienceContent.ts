import { useMemo } from 'react'

import { ChatBlast, ChatBlastAudience, OptionalHashId } from '@audius/sdk'

import {
  useGetCurrentUser,
  useGetCurrentUserId,
  useGetPlaylistById,
  useGetPurchasersCount,
  useGetTrackById,
  useRemixersCount
} from '~/api'
import {
  getChatBlastAudienceDescription,
  getChatBlastCTA,
  getChatBlastSecondaryTitle,
  getChatBlastTitle
} from '~/utils'

export const useChatBlastAudienceContent = ({ chat }: { chat: ChatBlast }) => {
  const {
    audience,
    audience_content_id: audienceContentId,
    audience_content_type: audienceContentType
  } = chat

  const decodedContentId = audienceContentId
    ? OptionalHashId.parse(audienceContentId)
    : undefined

  const { data: currentUserId } = useGetCurrentUserId({})
  const { data: user } = useGetCurrentUser({})
  const { data: track } = useGetTrackById(
    {
      id: decodedContentId!
    },
    { disabled: !decodedContentId || audienceContentType !== 'track' }
  )
  const { data: album } = useGetPlaylistById(
    {
      playlistId: decodedContentId!
    },
    { disabled: !decodedContentId || audienceContentType !== 'album' }
  )

  const { data: purchasersCount } = useGetPurchasersCount(
    {
      userId: currentUserId!,
      contentId: decodedContentId,
      contentType: audienceContentType
    },
    {
      disabled: audience !== ChatBlastAudience.CUSTOMERS || !currentUserId
    }
  )

  const { data: remixersCount } = useRemixersCount(
    { trackId: decodedContentId },
    { enabled: audience === ChatBlastAudience.REMIXERS }
  )

  const audienceCount = useMemo(() => {
    switch (audience) {
      case ChatBlastAudience.FOLLOWERS:
        return user?.follower_count
      case ChatBlastAudience.TIPPERS:
        return user?.supporter_count
      case ChatBlastAudience.CUSTOMERS:
        return purchasersCount
      case ChatBlastAudience.REMIXERS:
        return remixersCount
      default:
        return 0
    }
  }, [
    audience,
    user?.follower_count,
    user?.supporter_count,
    purchasersCount,
    remixersCount
  ])

  const contentTitle = audienceContentId
    ? audienceContentType === 'track'
      ? track?.title
      : album?.playlist_name
    : undefined

  const chatBlastTitle = getChatBlastTitle(audience)
  const chatBlastSecondaryTitle = getChatBlastSecondaryTitle({
    audience,
    audienceContentId
  })
  const chatBlastAudienceDescription = getChatBlastAudienceDescription({
    audience
  })
  const chatBlastCTA = getChatBlastCTA({ audience, audienceContentId })

  return {
    chatBlastTitle,
    chatBlastSecondaryTitle,
    chatBlastAudienceDescription,
    chatBlastCTA,
    contentTitle,
    audienceCount,
    audienceContentId: decodedContentId,
    audienceContentType
  }
}
