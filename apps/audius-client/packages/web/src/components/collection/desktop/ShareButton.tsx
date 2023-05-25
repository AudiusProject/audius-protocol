import { useCallback } from 'react'

import {
  ID,
  shareModalUIActions,
  ShareSource,
  SmartCollectionVariant
} from '@audius/common'
import { Button, ButtonProps, ButtonType, IconShare } from '@audius/stems'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import styles from './CollectionHeader.module.css'
import { BUTTON_COLLAPSE_WIDTHS } from './utils'

const { requestOpen: requestOpenShareModal } = shareModalUIActions

const messages = {
  share: 'Share'
}

type ShareButtonProps = Partial<ButtonProps> & {
  collectionId: SmartCollectionVariant | ID
  userId?: ID
}

export const ShareButton = (props: ShareButtonProps) => {
  const { collectionId, type, userId, ...other } = props
  const dispatch = useDispatch()

  const handleShare = useCallback(() => {
    if (typeof collectionId !== 'number') {
      if (
        collectionId === SmartCollectionVariant.AUDIO_NFT_PLAYLIST &&
        userId
      ) {
        dispatch(
          requestOpenShareModal({
            type: 'audioNftPlaylist',
            userId,
            source: ShareSource.PAGE
          })
        )
      }
    } else {
      dispatch(
        requestOpenShareModal({
          type: 'collection',
          collectionId,
          source: ShareSource.PAGE
        })
      )
    }
  }, [dispatch, collectionId, userId])

  return (
    <Button
      className={cn(styles.buttonFormatting)}
      textClassName={styles.buttonTextFormatting}
      type={type ?? ButtonType.COMMON}
      text={messages.share}
      leftIcon={<IconShare />}
      widthToHideText={BUTTON_COLLAPSE_WIDTHS.second}
      onClick={handleShare}
      {...other}
    />
  )
}
