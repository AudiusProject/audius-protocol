import React, { memo } from 'react'

import { IconDownload } from '@audius/stems'
import cn from 'classnames'

import { ID } from 'common/models/Identifiers'
import IconButton from 'components/general/IconButton'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import Tooltip from 'components/tooltip/Tooltip'

import styles from './DownloadButtons.module.css'
import { useButtons } from './hooks'

export enum ButtonState {
  PROCESSING,
  LOG_IN_REQUIRED,
  DOWNLOADABLE,
  REQUIRES_FOLLOW
}

export enum ButtonType {
  STEM,
  TRACK
}

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
  getDownloadTrack: (stemCount: number) => `${stemCount ? 'Original' : ''}`,
  getDownloadStem: (friendlyName: string, categoryCount: number) =>
    `${friendlyName} ${categoryCount || ''}`,
  addDownloadPrefix: (label: string) => `Download ${label}`
}

const DownloadButton = ({
  label,
  state,
  type,
  onClick = () => {}
}: DownloadButtonProps) => {
  const shouldShowTooltip =
    state === ButtonState.PROCESSING || state === ButtonState.REQUIRES_FOLLOW

  const getTooltipText = () => {
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
  }

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
        <IconButton icon={<IconDownload />} />
      </div>
    )
  }

  const renderButton = () => {
    const isDisabled =
      state === ButtonState.PROCESSING || state === ButtonState.REQUIRES_FOLLOW

    return (
      <div
        className={cn(styles.downloadButtonContainer, {
          [styles.disabled]: isDisabled
        })}
        onClick={isDisabled ? () => {} : onClick}
      >
        <div className={styles.icon}>{renderIcon()}</div>
        {/* h2 here for SEO purposes */}
        <h2 className={styles.label}>{messages.addDownloadPrefix(label)}</h2>
      </div>
    )
  }

  return shouldShowTooltip ? (
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
  isHidden,
  className
}: DownloadButtonsProps) => {
  const buttons = useButtons(trackId, onDownload, isOwner, following)

  return (
    <div
      className={cn(styles.downloadButtonsContainer, {
        [className!]: !!className,
        [styles.isHidden]: isHidden
      })}
    >
      {buttons.map(({ label, state, type, onClick }) => (
        <DownloadButton
          label={label}
          state={state}
          type={type}
          key={label}
          onClick={onClick}
        />
      ))}
    </div>
  )
}

export default memo(DownloadButtons)
