import { useCallback, useState, useEffect, useRef } from 'react'

import {
  SquareSizes,
  isContentCollectibleGated,
  isContentUSDCPurchaseGated,
  ID,
  AccessConditions,
  Track,
  User
} from '@audius/common/models'
import { Nullable } from '@audius/common/utils'
import {
  Modal,
  Button,
  ButtonType,
  ModalContent,
  ModalHeader,
  ModalTitle
} from '@audius/stems'
import cn from 'classnames'
import { debounce } from 'lodash'

import IconRemix from 'assets/img/iconRemix.svg'
import Input from 'components/data-entry/Input'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { HelpCallout } from 'components/help-callout/HelpCallout'
import Switch from 'components/switch/Switch'
import UserBadges from 'components/user-badges/UserBadges'
import { useTrackCoverArt } from 'hooks/useTrackCoverArt'
import { fullTrackPage } from 'utils/route'
import { withNullGuard } from 'utils/withNullGuard'

import styles from './RemixSettingsModal.module.css'

const INPUT_DEBOUNCE_MS = 1000

const messages = {
  done: 'DONE',
  done2: 'Done',
  title: 'REMIX SETTINGS',
  subtitle: 'Specify what track you remixed here',
  remixOf: 'This is a Remix of: (Paste Audius Track URL)',
  error: 'Please paste a valid Audius track URL',
  by: 'by',
  changeAvailabilityPrefix: 'Availablity is set to ',
  changeAvailabilitySuffix:
    '. To enable these options, change availability to Public.',
  premium: 'Premium (Pay-to-Unlock)',
  collectibleGated: 'Collectible Gated',
  specialAccess: 'Special Access',
  markAsRemix: 'Mark This Track as a Remix',
  pasteLink: 'Paste the link to the Audius track you’ve remixed',
  enterLink: 'Enter an Audius Link',
  hideOtherRemixes: 'Hide Other’s Remixes of this Track',
  preventOtherRemixes:
    'Enabling this option will prevent other user’s remixes from appearing on your track page.'
}

type TrackInfoProps = {
  track: Track | null
  user: User | null
}

const g = withNullGuard(
  ({ track, user, ...p }: TrackInfoProps) =>
    track && user && { ...p, track, user }
)

const TrackInfo = g(({ track, user }) => {
  const image = useTrackCoverArt(
    track.track_id,
    track._cover_art_sizes,
    SquareSizes.SIZE_150_BY_150
  )
  return (
    <div className={styles.track}>
      <DynamicImage wrapperClassName={styles.artwork} image={image} />
      {track.title}
      <div className={styles.by}>{messages.by}</div>
      <div className={styles.artistName}>
        {user.name}
        <UserBadges
          className={styles.iconVerified}
          userId={user.user_id}
          badgeSize={8}
        />
      </div>
    </div>
  )
})

type RemixSettingsModalProps = {
  isOpen: boolean
  onClose: (trackId: ID | null) => void
  onEditUrl: (url: string) => void
  isStreamGated: boolean
  streamConditions: Nullable<AccessConditions>
  isRemix: boolean
  setIsRemix: (isRemix: boolean) => void
  onChangeField: (field: string, value: any) => void
  reset: () => void
  isInvalidTrack: boolean
  track: Track | null
  user: User | null
  hideRemixes?: boolean
  onToggleHideRemixes?: () => void
}

const RemixSettingsModal = ({
  isOpen,
  onClose,
  onEditUrl,
  isStreamGated,
  streamConditions,
  isRemix,
  setIsRemix,
  onChangeField,
  reset,
  track,
  user,
  isInvalidTrack,
  hideRemixes,
  onToggleHideRemixes
}: RemixSettingsModalProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const [url, setUrl] = useState<string | null>(null)

  const isUSDCPurchaseGated = isContentUSDCPurchaseGated(streamConditions)
  const isHideRemixesDisabled = isStreamGated && !isUSDCPurchaseGated

  useEffect(() => {
    if (url === null && track && isOpen) {
      setUrl(fullTrackPage(track.permalink))
    }
  }, [isOpen, track, url, setUrl])

  useEffect(() => {
    if (!isOpen) setUrl(null)
  }, [isOpen])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, inputRef])

  const onChange = useCallback(
    (url: string) => {
      // Need to decode the URL
      // here to properly show pasted
      // URLS with non-ascii chars
      const decoded = decodeURI(url)
      setUrl(decoded)
      debounce(() => onEditUrl(decoded), INPUT_DEBOUNCE_MS, {
        leading: true,
        trailing: false
      })()
      // Turn toggle on if remix link input is not empty
      if (url) {
        setIsRemix(true)
      }
    },
    [onEditUrl, setUrl, setIsRemix]
  )

  const onCloseModal = useCallback(() => {
    const trackId = url && track && !isInvalidTrack ? track.track_id : null
    onClose(trackId)
  }, [onClose, track, isInvalidTrack, url])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCloseModal}
      wrapperClassName={styles.remixSettingsModalContainer}
      dismissOnClickOutside
    >
      <ModalHeader
        className={styles.remixSettingsModalHeader}
        onClose={onCloseModal}
        showDismissButton
        dismissButtonClassName={styles.remixSettingsModalHeaderDismissButton}
      >
        <ModalTitle
          title={messages.title}
          icon={<IconRemix className={styles.remixSettingsModalTitleIcon} />}
        />
      </ModalHeader>
      <ModalContent>
        {isStreamGated ? (
          <HelpCallout
            className={styles.disableInfo}
            content={`${messages.changeAvailabilityPrefix} ${
              isUSDCPurchaseGated
                ? messages.premium
                : isContentCollectibleGated(streamConditions)
                ? messages.collectibleGated
                : messages.specialAccess
            }${messages.changeAvailabilitySuffix}`}
          />
        ) : null}
        <div className={styles.toggleRow}>
          <span className={cn({ [styles.remixDisabled]: isStreamGated })}>
            {messages.markAsRemix}
          </span>
          <Switch
            isOn={isRemix}
            handleToggle={(e) => {
              setIsRemix(!isRemix)
              if (isRemix) {
                onChangeField('remix_of', null)
                reset()
                setUrl(null)
              }
            }}
            isDisabled={isStreamGated}
          />
        </div>

        <div
          className={cn(styles.subtext, {
            [styles.remixDisabled]: isStreamGated
          })}
        >
          {messages.pasteLink}
        </div>
        <Input
          inputRef={inputRef}
          value={url}
          placeholder={messages.enterLink}
          size='large'
          onChange={onChange}
          disabled={isStreamGated}
        />
        {url && (
          <div className={styles.bottom}>
            {isInvalidTrack ? (
              <div className={styles.error}>{messages.error}</div>
            ) : (
              <TrackInfo user={user} track={track} />
            )}
          </div>
        )}

        <div className={styles.divider} />

        <div className={styles.toggleRow}>
          <span
            className={cn({ [styles.remixDisabled]: isHideRemixesDisabled })}
          >
            {messages.hideOtherRemixes}
          </span>
          <Switch
            isOn={!!hideRemixes || isHideRemixesDisabled}
            handleToggle={() => onToggleHideRemixes?.()}
            isDisabled={isHideRemixesDisabled}
            allowCheckedWhileDisabled
          />
        </div>
        <div
          className={cn(styles.subtext, {
            [styles.remixDisabled]: isHideRemixesDisabled
          })}
        >
          {messages.preventOtherRemixes}
        </div>

        <div className={styles.doneButtonContainer}>
          <Button
            textClassName={styles.doneButton2}
            text={messages.done2}
            type={ButtonType.PRIMARY_ALT}
            onClick={onCloseModal}
          />
        </div>
      </ModalContent>
    </Modal>
  )
}

export default RemixSettingsModal
