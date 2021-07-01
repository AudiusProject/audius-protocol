import React, { memo, useContext } from 'react'

import FavoriteButton from 'components/general/alt-button/FavoriteButton'
import MoreButton from 'components/general/alt-button/MoreButton'
import RepostButton from 'components/general/alt-button/RepostButton'
import ShareButton from 'components/general/alt-button/ShareButton'
import { ToastContext } from 'components/toast/ToastContext'
import { isShareToastDisabled } from 'utils/clipboardUtil'
import { SHARE_TOAST_TIMEOUT_MILLIS } from 'utils/constants'

import styles from './BottomButtons.module.css'

type BottomButtonsProps = {
  hasSaved: boolean
  hasReposted: boolean
  toggleSave: () => void
  toggleRepost: () => void
  onClickOverflow: () => void
  onShare: () => void
  isOwner: boolean
  isDarkMode: boolean
  isMatrixMode: boolean
}

const messages = {
  copiedToast: 'Copied To Clipboard'
}

const BottomButtons = (props: BottomButtonsProps) => {
  const { toast } = useContext(ToastContext)

  return (
    <div className={styles.bottomButtons}>
      <RepostButton
        onClick={() => props.toggleRepost()}
        isActive={props.hasReposted}
        isDisabled={props.isOwner}
        isDarkMode={props.isDarkMode}
        isMatrixMode={props.isMatrixMode}
      />
      <FavoriteButton
        onClick={() => props.toggleSave()}
        isActive={props.hasSaved}
        isDisabled={props.isOwner}
        isDarkMode={props.isDarkMode}
        isMatrixMode={props.isMatrixMode}
      />
      <ShareButton
        onClick={() => {
          if (!isShareToastDisabled) {
            toast(messages.copiedToast, SHARE_TOAST_TIMEOUT_MILLIS)
          }
          props.onShare()
        }}
        isDarkMode={props.isDarkMode}
        isMatrixMode={props.isMatrixMode}
      />
      <MoreButton
        onClick={props.onClickOverflow}
        isDarkMode={props.isDarkMode}
        isMatrixMode={props.isMatrixMode}
      />
    </div>
  )
}

export default memo(BottomButtons)
