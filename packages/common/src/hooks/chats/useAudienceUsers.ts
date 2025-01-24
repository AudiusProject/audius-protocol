import { ChatBlast, ChatBlastAudience } from '@audius/sdk'

import {
  useCurrentUserId,
  useFollowers,
  usePurchasers,
  useRemixers,
  useSupporters
} from '~/api'
import { UserMetadata } from '~/models'

export const useAudienceUsers = (chat: ChatBlast, limit?: number) => {
  const { data: currentUserId } = useCurrentUserId()

  const contentId = chat.audience_content_id
    ? parseInt(chat.audience_content_id)
    : undefined

  const { data: followers } = useFollowers({
    userId: currentUserId,
    pageSize: limit
  })
  const { data: supporters } = useSupporters(
    { userId: currentUserId!, pageSize: limit },
    { enabled: chat.audience === ChatBlastAudience.TIPPERS }
  )
  const { data: purchasers } = usePurchasers({
    contentId,
    contentType: chat.audience_content_type,
    pageSize: limit
  })
  const { data: remixers } = useRemixers({
    userId: currentUserId!,
    trackId: contentId,
    pageSize: limit
  })

  let users: UserMetadata[] = []
  switch (chat.audience) {
    case ChatBlastAudience.FOLLOWERS:
      users = followers ?? []
      break
    case ChatBlastAudience.TIPPERS:
      users = supporters?.map((supporter) => supporter.sender) ?? []
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
