import { useCallback } from 'react'

import { ShareSource, ID } from '@audius/common/models'
import { shareModalUIActions } from '@audius/common/store'
import { Nullable } from '@audius/common/utils'
import { IconShare, IconButton } from '@audius/harmony'
import { useDispatch } from 'react-redux'

const { requestOpen: requestOpenShareModal } = shareModalUIActions

type ShareUserButtonProps = {
  userId: Nullable<ID>
}

export const ShareUserButton = ({ userId }: ShareUserButtonProps) => {
  const dispatch = useDispatch()
  const handleClick = useCallback(() => {
    if (userId) {
      dispatch(
        requestOpenShareModal({
          type: 'profile',
          profileId: userId,
          source: ShareSource.PAGE
        })
      )
    }
  }, [dispatch, userId])

  return (
    <IconButton aria-label='share' icon={IconShare} onClick={handleClick} />
  )
}
