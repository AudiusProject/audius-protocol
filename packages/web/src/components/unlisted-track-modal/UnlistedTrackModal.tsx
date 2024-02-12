import { Switch } from '@audius/harmony'
import { Modal } from '@audius/stems'
import cn from 'classnames'

import styles from './UnlistedTrackModal.module.css'

const messages = {
  title: 'TRACK VISIBILITY',
  subtitle:
    "Hidden tracks won't show up on your profile.\nAnyone who has the link will be able to listen.",
  hideTrack: 'Hide Track'
}

// All possible toggleable fields
enum TrackMetadataField {
  UNLISTED = 'unlisted',
  GENRE = 'genre',
  MOOD = 'mood',
  TAGS = 'tags',
  SHARE = 'share',
  PLAYS = 'plays'
}

// The order of toggles in the modal
const trackMetadataOrder = [
  TrackMetadataField.GENRE,
  TrackMetadataField.MOOD,
  TrackMetadataField.TAGS,
  TrackMetadataField.SHARE,
  TrackMetadataField.PLAYS
]

// Maps switch identifiers to section titles on the UI
const metadataTitleMap = {
  [TrackMetadataField.UNLISTED]: 'Track',
  [TrackMetadataField.GENRE]: 'Genre',
  [TrackMetadataField.MOOD]: 'Mood',
  [TrackMetadataField.TAGS]: 'Tags',
  [TrackMetadataField.SHARE]: 'Share Button',
  [TrackMetadataField.PLAYS]: 'Play Count'
}

type TrackMetadataSectionProps = {
  title: string
  isVisible: boolean
  isDisabled: boolean
  didSet: (enabled: boolean) => void
}

// Individual section of the modal.
const TrackMetadataSection = ({
  title,
  isVisible,
  isDisabled,
  didSet
}: TrackMetadataSectionProps) => {
  return (
    <div
      className={cn(styles.section, { [styles.disabledSection]: isDisabled })}
    >
      <span>{title}</span>
      <div className={styles.switchContainer}>
        <Switch
          checked={isVisible}
          onChange={() => {
            didSet(!isVisible)
          }}
          disabled={isDisabled}
        />
      </div>
    </div>
  )
}

type UnlistedTrackModalProps = {
  // Whether or not to show the hide track switch or just metadata switches..
  showHideTrackSwitch: boolean
  isOpen: boolean
  metadataState: TrackMetadataState
  didUpdateState: (newState: TrackMetadataState) => void
  onClose: () => void
}

type TrackMetadataState = {
  unlisted: boolean
  genre: boolean
  mood: boolean
  tags: boolean
  share: boolean
  plays: boolean
}

// A modal that allows you to toggle a track to unlisted, as
// well as toggle individual metadata field visibility.
const UnlistedTrackModal = ({
  showHideTrackSwitch,
  isOpen,
  metadataState,
  didUpdateState,
  onClose
}: UnlistedTrackModalProps) => {
  const makeDidSetField = (field: TrackMetadataField) => (visible: boolean) => {
    const newState = { ...metadataState }
    newState[field] = visible
    didUpdateState(newState)
  }

  const makeSectionTitle = (metadata: TrackMetadataField) =>
    `Show ${metadataTitleMap[metadata]}`

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showDismissButton
      showTitleHeader
      title={messages.title}
      subtitle={messages.subtitle}
      contentHorizontalPadding={32}
      bodyClassName={styles.modalBodyStyle}
      titleClassName={styles.modalTitleStyle}
    >
      <div className={styles.container}>
        {showHideTrackSwitch && (
          <div className={styles.hideTracksSection}>
            <TrackMetadataSection
              isDisabled={false}
              isVisible={metadataState.unlisted}
              title={messages.hideTrack}
              didSet={makeDidSetField(TrackMetadataField.UNLISTED)}
            />
          </div>
        )}
        {trackMetadataOrder.map((field, i) => {
          return (
            <TrackMetadataSection
              key={i}
              isDisabled={!metadataState.unlisted}
              isVisible={metadataState[field]}
              title={makeSectionTitle(field)}
              didSet={makeDidSetField(field)}
            />
          )
        })}
      </div>
    </Modal>
  )
}

export default UnlistedTrackModal
