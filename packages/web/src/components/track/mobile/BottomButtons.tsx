import React, { memo, useContext } from 'react'

import { SHARE_TOAST_TIMEOUT_MILLIS } from 'utils/constants'
import { isShareToastDisabled } from 'utils/clipboardUtil'
import styles from './BottomButtons.module.css'
import FavoriteButton from 'components/general/alt-button/FavoriteButton'
import RepostButton from 'components/general/alt-button/RepostButton'
import ShareButton from 'components/general/alt-button/ShareButton'
import MoreButton from 'components/general/alt-button/MoreButton'
import { ToastContext } from 'components/toast/ToastContext'

type BottomButtonsProps = {
  hasSaved: boolean
  hasReposted: boolean
  toggleSave: () => void
  toggleRepost: () => void
  onClickOverflow: () => void
  onShare: () => void
  isOwner: boolean
  darkMode: boolean
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
        isDarkMode={props.darkMode}
      />
      <FavoriteButton
        onClick={() => props.toggleSave()}
        isActive={props.hasSaved}
        isDisabled={props.isOwner}
        isDarkMode={props.darkMode}
      />
      <ShareButton
        onClick={() => {
          if (!isShareToastDisabled) {
            toast(messages.copiedToast, SHARE_TOAST_TIMEOUT_MILLIS)
          }
          props.onShare()
        }}
        isDarkMode={props.darkMode}
      />
      <MoreButton onClick={props.onClickOverflow} isDarkMode={props.darkMode} />
    </div>
  )
}

export default memo(BottomButtons)
