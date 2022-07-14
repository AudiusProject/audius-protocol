import { useCallback } from 'react'

import { ID } from '@audius/common'
import { IconShare, IconButton } from '@audius/stems'
import { useDispatch } from 'react-redux'

import { ShareSource } from 'common/models/Analytics'
import { requestOpen as requestOpenShareModal } from 'common/store/ui/share-modal/slice'
import { Nullable } from 'common/utils/typeUtils'

import styles from './ShareUserButton.module.css'

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
