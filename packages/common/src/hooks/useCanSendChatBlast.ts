import { useGetCurrentUserId } from '~/api'
import { IntKeys } from '~/services'
import { useTierAndVerifiedForUser } from '~/store'

import { useRemoteVar } from './useRemoteVar'

export const useCanSendChatBlast = () => {
  const { data: userId } = useGetCurrentUserId()
  const { tierNumber, isVerified } = useTierAndVerifiedForUser(userId)

  const chatBlastTier = useRemoteVar(IntKeys.CHAT_BLAST_TIER_REQUIREMENT)
  return isVerified || tierNumber >= chatBlastTier
}
