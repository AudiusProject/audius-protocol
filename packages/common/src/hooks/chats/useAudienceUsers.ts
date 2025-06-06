import { ChatBlast, ChatBlastAudience, OptionalHashId } from '@audius/sdk'

import {
  useCurrentUserId,
  useFollowers,
  usePurchasers,
  useRemixers,
  useSupporters,
  useUsers
} from '~/api'
import { UserMetadata } from '~/models'
import { PurchaseableContentType } from '~/store/purchase-content'

export const useAudienceUsers = (chat: ChatBlast, limit?: number) => {
  const { data: currentUserId } = useCurrentUserId()

  const { data: followerIds } = useFollowers({
    userId: currentUserId,
    pageSize: limit
  })
  const { data: followers } = useUsers(followerIds)
  const { data: supporters } = useSupporters(
    { userId: currentUserId, pageSize: limit },
    { enabled: chat.audience === ChatBlastAudience.TIPPERS }
  )
  const { data: purchasers } = usePurchasers(
    {
      contentId: OptionalHashId.parse(chat.audience_content_id),
      contentType: chat.audience_content_type as PurchaseableContentType,
      pageSize: limit
    },
    { enabled: chat.audience === ChatBlastAudience.CUSTOMERS }
  )

  const { data: remixers } = useRemixers(
    {
      userId: currentUserId,
      trackId: OptionalHashId.parse(chat.audience_content_id),
      pageSize: limit
    },
    { enabled: chat.audience === ChatBlastAudience.REMIXERS }
  )

  const { data: purchasersUsers } = useUsers(purchasers)
  const { data: remixersUsers } = useUsers(remixers)

  let users: UserMetadata[] = []
  switch (chat.audience) {
    case ChatBlastAudience.FOLLOWERS:
      users = followers ?? []
      break
    case ChatBlastAudience.TIPPERS:
      users = supporters?.map((supporter) => supporter.sender) ?? []
      break
    case ChatBlastAudience.CUSTOMERS:
      users = purchasersUsers ?? []
      break
    case ChatBlastAudience.REMIXERS:
      users = remixersUsers ?? []
      break
  }

  return users
}
