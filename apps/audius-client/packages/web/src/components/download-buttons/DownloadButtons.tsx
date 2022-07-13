import { memo, useCallback } from 'react'

import { IconDownload, IconButton } from '@audius/stems'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'

import {
  ButtonState,
  ButtonType,
  useDownloadTrackButtons
} from 'common/hooks/useDownloadTrackButtons'
import { ID } from 'common/models/Identifiers'
import { toast } from 'common/store/ui/toast/slice'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import Tooltip from 'components/tooltip/Tooltip'
import {
  openSignOn,
  updateRouteOnExit,
  updateRouteOnCompletion,
  showRequiresAccountModal
} from 'pages/sign-on/store/actions'
import { useIsMobile } from 'utils/clientUtil'

import styles from './DownloadButtons.module.css'

export type DownloadButtonProps = {
  state: ButtonState
  type: ButtonType
  label: string
  onClick?: () => void
}

export const messages = {
  downloadableTrack: 'Download this Track',
  downloadableStem: 'Download this source file',
  followToDownload: 'Must follow artist to download',
  processingTrack: 'Processing',
  processingStem: 'Uploading',
  addDownloadPrefix: (label: string) => `Download ${label}`
}

const DownloadButton = ({
  label,
  state,
  type,
  onClick = () => {}
}: DownloadButtonProps) => {
  const dispatch = useDispatch()
  const isMobile = useIsMobile()
  const isDisabled =
    state === ButtonState.PROCESSING || state === ButtonState.REQUIRES_FOLLOW

  const getTooltipText = useCallback(() => {
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
  }, [state, type])

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
        onClick={handleOnClick}>
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
  onDownload: (
    trackId: ID,
    cid: string,
    category?: string,
    parentTrackId?: ID
  ) => void
  isOwner: boolean
  following: boolean
  isHidden?: boolean
  className?: string
}

const DownloadButtons = ({
  trackId,
  isOwner,
  following,
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
    trackId,
    useSelector
  })
  const shouldHide = buttons.length === 0
  if (shouldHide) {
    return null
  }

  return (
    <div
      className={cn({
        [className!]: !!className
      })}>
      {buttons.map((props) => (
        <DownloadButton {...props} key={props.label} />
      ))}
    </div>
  )
}

export default memo(DownloadButtons)
