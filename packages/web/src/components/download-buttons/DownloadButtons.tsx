import { memo, useCallback } from 'react'

import { toastActions } from '@audius/common'
import {
  ButtonState,
  ButtonType,
  useDownloadTrackButtons
} from '@audius/common/hooks'
import { ID } from '@audius/common/models'
import { IconDownload, IconButton } from '@audius/stems'
import cn from 'classnames'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router-dom'

import {
  openSignOn,
  updateRouteOnExit,
  updateRouteOnCompletion,
  showRequiresAccountModal
} from 'common/store/pages/signon/actions'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import Tooltip from 'components/tooltip/Tooltip'
import { useIsMobile } from 'hooks/useIsMobile'

import styles from './DownloadButtons.module.css'
const { toast } = toastActions

export type DownloadButtonProps = {
  state: ButtonState
  type: ButtonType
  label: string
  hasDownloadAccess: boolean
  onClick?: () => void
}

export const messages = {
  downloadableTrack: 'Download this Track',
  downloadableStem: 'Download this source file',
  followToDownload: 'Must follow artist to download',
  processingTrack: 'Processing',
  processingStem: 'Uploading',
  mustHaveAccess: 'Must have access to download',
  addDownloadPrefix: (label: string) => `Download ${label}`
}

const DownloadButton = ({
  label,
  state,
  type,
  hasDownloadAccess,
  onClick = () => {}
}: DownloadButtonProps) => {
  const dispatch = useDispatch()
  const isMobile = useIsMobile()
  const isDisabled =
    !hasDownloadAccess ||
    state === ButtonState.PROCESSING ||
    state === ButtonState.REQUIRES_FOLLOW

  const getTooltipText = useCallback(() => {
    if (!hasDownloadAccess) {
      return messages.mustHaveAccess
    }

    switch (state) {
      case ButtonState.PROCESSING:
        return type === ButtonType.STEM
          ? messages.processingStem
          : messages.processingTrack
      case ButtonState.REQUIRES_FOLLOW:
        return messages.followToDownload
      case ButtonState.LOG_IN_REQUIRED:
      case ButtonState.DOWNLOADABLE:
        switch (type) {
          case ButtonType.STEM:
            return messages.downloadableStem
          case ButtonType.TRACK:
            return messages.downloadableTrack
        }
    }
  }, [hasDownloadAccess, state, type])

  const renderIcon = () => {
    if (state === ButtonState.PROCESSING) {
      return (
        <div className={styles.iconProcessingContainer}>
          <LoadingSpinner className={styles.iconProcessing} />
        </div>
      )
    }

    return (
      <div className={styles.iconDownload}>
        <IconButton aria-label='Download' icon={<IconDownload />} />
      </div>
    )
  }

  const handleOnClick = useCallback(() => {
    if (isMobile && isDisabled) {
      // On mobile, show a toast instead of a tooltip
      dispatch(toast({ content: getTooltipText() }))
    }

    if (isDisabled) {
      return
    }

    onClick()
  }, [dispatch, getTooltipText, isMobile, isDisabled, onClick])

  const renderButton = () => {
    return (
      <div
        className={cn(styles.downloadButtonContainer, {
          [styles.disabled]: isDisabled
        })}
        onClick={handleOnClick}
      >
        <div className={styles.icon}>{renderIcon()}</div>
        {/* h2 here for SEO purposes */}
        <h2 className={styles.label}>{messages.addDownloadPrefix(label)}</h2>
      </div>
    )
  }

  // Do not show tooltip on mobile (showing a toast instead)
  return !isMobile && isDisabled ? (
    <Tooltip text={getTooltipText()} placement='top' mouseEnterDelay={0}>
      {renderButton()}
    </Tooltip>
  ) : (
    renderButton()
  )
}

type DownloadButtonsProps = {
  trackId: ID
  onDownload: ({
    trackId,
    category,
    original,
    parentTrackId
  }: {
    trackId: ID
    category?: string
    original?: boolean
    parentTrackId?: ID
  }) => void
  isOwner: boolean
  following: boolean
  hasDownloadAccess: boolean
  isHidden?: boolean
  className?: string
}

const DownloadButtons = ({
  trackId,
  isOwner,
  following,
  hasDownloadAccess,
  onDownload,
  className
}: DownloadButtonsProps) => {
  const dispatch = useDispatch()
  const { location } = useHistory()
  const { pathname } = location

  const onNotLoggedInClick = useCallback(() => {
    dispatch(updateRouteOnCompletion(pathname))
    dispatch(updateRouteOnExit(pathname))
    dispatch(openSignOn())
    dispatch(showRequiresAccountModal())
  }, [dispatch, pathname])

  const buttons = useDownloadTrackButtons({
    following,
    isOwner,
    onDownload,
    onNotLoggedInClick,
    trackId
  })
  const shouldHide = buttons.length === 0
  if (shouldHide) {
    return null
  }

  return (
    <div
      className={cn({
        [className!]: !!className
      })}
    >
      {buttons.map((props) => (
        <DownloadButton
          {...props}
          hasDownloadAccess={hasDownloadAccess}
          key={props.label}
        />
      ))}
    </div>
  )
}

export default memo(DownloadButtons)
