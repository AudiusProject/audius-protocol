import { useCurrentUserId } from '~/api'
import { IntKeys } from '~/services'

import { useRemoteVar } from './useRemoteVar'
import { useSelectTierInfo } from './useSelectTierInfo'

export const useCanSendChatBlast = () => {
  const { data: userId } = useCurrentUserId()
  const { tierNumber, isVerified } = useSelectTierInfo(userId ?? 0) ?? {}

  const chatBlastTier = useRemoteVar(IntKeys.CHAT_BLAST_TIER_REQUIREMENT)
  return isVerified || tierNumber >= chatBlastTier
}
