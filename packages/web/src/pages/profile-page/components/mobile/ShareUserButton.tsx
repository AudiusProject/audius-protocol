import { useCallback } from 'react'

import { shareModalUIActions } from '@audius/common'
import { ShareSource, ID } from '@audius/common/models'
import { Nullable } from '@audius/common/utils'
import { IconShare, IconButton } from '@audius/stems'
import { useDispatch } from 'react-redux'

import styles from './ShareUserButton.module.css'
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
    <IconButton
      aria-label='share'
      className={styles.button}
      icon={<IconShare />}
      onClick={handleClick}
    />
  )
}
