import { ChatBlast, ChatBlastAudience } from '@audius/sdk'

import {
  useCurrentUserId,
  useFollowers,
  useGetPurchasers,
  useGetRemixers,
  useSupporters
} from '~/api'
import { UserMetadata } from '~/models'

export const useAudienceUsers = (chat: ChatBlast, limit?: number) => {
  const { data: currentUserId } = useCurrentUserId()

  const { data: followers } = useFollowers({
    userId: currentUserId,
    pageSize: limit
  })
  const { data: supporters } = useSupporters(
    { userId: currentUserId!, pageSize: limit },
    { enabled: chat.audience === ChatBlastAudience.TIPPERS }
  )
  const { data: purchasers } = useGetPurchasers({
    userId: currentUserId!,
    contentId: chat.audience_content_id
      ? parseInt(chat.audience_content_id)
      : undefined,
    contentType: chat.audience_content_type,
    limit
  })
  const { data: remixers } = useGetRemixers({
    userId: currentUserId!,
    trackId: chat.audience_content_id,
    limit
  })

  let users: UserMetadata[] = []
  switch (chat.audience) {
    case ChatBlastAudience.FOLLOWERS:
      users = followers ?? []
      break
    case ChatBlastAudience.TIPPERS:
      users = supporters ?? []
      break
    case ChatBlastAudience.CUSTOMERS:
      users = purchasers ?? []
      break
    case ChatBlastAudience.REMIXERS:
      users = remixers ?? []
      break
  }

  return users
}
