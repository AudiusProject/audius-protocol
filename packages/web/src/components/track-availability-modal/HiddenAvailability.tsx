import { IconHidden } from '@audius/stems'
import cn from 'classnames'

import Switch from '../switch/Switch'

import styles from './TrackAvailabilityModal.module.css'
import {
  TrackAvailabilitySelectionProps,
  UnlistedTrackMetadataField
} from './types'

const messages = {
  hidden: 'Hidden',
  hiddenSubtitle:
    "Hidden tracks won't be visible to your followers. Only you will see them on your profile. Anyone who has the link will be able to listen.",
  showGenre: 'Show Genre',
  showMood: 'Show Mood',
  showTags: 'Show Tags',
  showShareButton: 'Show Share Button',
  showPlayCount: 'Show Play Count'
}

// The order of toggles in the modal
const unlistedTrackMetadataOrder = [
  UnlistedTrackMetadataField.GENRE,
  UnlistedTrackMetadataField.MOOD,
  UnlistedTrackMetadataField.TAGS,
  UnlistedTrackMetadataField.SHARE,
  UnlistedTrackMetadataField.PLAYS
]

const hiddenTrackMetadataMap = {
  [UnlistedTrackMetadataField.UNLISTED]: '',
  [UnlistedTrackMetadataField.GENRE]: messages.showGenre,
  [UnlistedTrackMetadataField.MOOD]: messages.showMood,
  [UnlistedTrackMetadataField.TAGS]: messages.showTags,
  [UnlistedTrackMetadataField.SHARE]: messages.showShareButton,
  [UnlistedTrackMetadataField.PLAYS]: messages.showPlayCount
}

type HiddenTrackMetadataSectionProps = {
  title: string
  isVisible: boolean
  isDisabled: boolean
  didSet: (enabled: boolean) => void
}

const HiddenTrackMetadataSection = ({
  title,
  isVisible,
  isDisabled,
  didSet
}: HiddenTrackMetadataSectionProps) => {
  return (
    <div className={styles.section}>
      <span className={styles.sectionTitleClassname}>{title}</span>
      <div className={styles.switchContainer}>
        <Switch
          isOn={isVisible}
          handleToggle={(e) => {
            e.stopPropagation()
            didSet(!isVisible)
          }}
          isDisabled={isDisabled}
        />
      </div>
    </div>
  )
}

export const HiddenAvailability = ({
  selected,
  metadataState,
  updateUnlistedField,
  updateHiddenField
}: TrackAvailabilitySelectionProps) => {
  return (
    <div className={cn(styles.radioItem, { [styles.selected]: selected })}>
      <div
        className={styles.availabilityRowContent}
        onClick={updateUnlistedField}
      >
        <div className={styles.availabilityRowTitle}>
          <IconHidden className={styles.availabilityRowIcon} />
          <span>{messages.hidden}</span>
        </div>
        <div className={styles.availabilityRowDescription}>
          {messages.hiddenSubtitle}
        </div>
        {selected && (
          <div
            className={cn(
              styles.availabilityRowSelection,
              styles.hiddenSection
            )}
          >
            <div>
              {unlistedTrackMetadataOrder.slice(0, 3).map((label, i) => {
                return (
                  <HiddenTrackMetadataSection
                    key={i}
                    isDisabled={false}
                    isVisible={metadataState[label]}
                    title={hiddenTrackMetadataMap[label]}
                    didSet={updateHiddenField!(label)}
                  />
                )
              })}
            </div>
            <div>
              {unlistedTrackMetadataOrder.slice(3).map((label, i) => {
                return (
                  <HiddenTrackMetadataSection
                    key={i}
                    isDisabled={false}
                    isVisible={metadataState[label]}
                    title={hiddenTrackMetadataMap[label]}
                    didSet={updateHiddenField!(label)}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
