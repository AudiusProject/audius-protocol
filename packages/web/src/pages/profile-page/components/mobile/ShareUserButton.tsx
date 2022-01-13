import React, { useCallback } from 'react'

import { IconShare } from '@audius/stems'
import { useDispatch } from 'react-redux'

import { ShareSource } from 'common/models/Analytics'
import { ID } from 'common/models/Identifiers'
import { requestOpen as requestOpenShareModal } from 'common/store/ui/share-modal/slice'
import { Nullable } from 'common/utils/typeUtils'
import IconButton from 'components/icon-button/IconButton'

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
      className={styles.button}
      icon={<IconShare />}
      onClick={handleClick}
    />
  )
}
