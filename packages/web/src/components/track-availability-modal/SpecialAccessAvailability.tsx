import { accountSelectors } from '@audius/common'
import { IconInfo, IconSpecialAccess } from '@audius/stems'
import cn from 'classnames'
import { useSelector } from 'react-redux'

import Tooltip from 'components/tooltip/Tooltip'

import styles from './TrackAvailabilityModal.module.css'
import { AvailabilityType, TrackAvailabilitySelectionProps } from './types'

const { getUserId } = accountSelectors

const messages = {
  specialAccess: 'Special Access',
  specialAccessSubtitle:
    'Special Access content is only available to users who meet your pre-specified criteria.',
  followersOnly: 'Available to Followers Only',
  supportersOnly: 'Available to Supporters Only',
  supportersInfo: 'Supporters are users who have sent you a tip'
}

export const SpecialAccessAvailability = ({
  selected,
  metadataState,
  updatePremiumContentFields
}: TrackAvailabilitySelectionProps) => {
  const accountUserId = useSelector(getUserId)

  return (
    <div className={cn(styles.radioItem, { [styles.selected]: selected })}>
      <div
        className={styles.availabilityRowContent}
        onClick={() => {
          if (updatePremiumContentFields) {
            updatePremiumContentFields(null, AvailabilityType.SPECIAL_ACCESS)
          }
        }}
      >
        <div className={styles.availabilityRowTitle}>
          <IconSpecialAccess className={styles.availabilityRowIcon} />
          <span>{messages.specialAccess}</span>
        </div>
        <div className={styles.availabilityRowDescription}>
          {messages.specialAccessSubtitle}
        </div>
        {selected && (
          <div className={styles.availabilityRowSelection}>
            <label
              className={cn(styles.radioItem, styles.specialAccessRadioItem, {
                [styles.selected]:
                  !!metadataState.premium_conditions?.follow_user_id
              })}
            >
              <input
                className={styles.radioInput}
                type='radio'
                name='special-access'
                value='follower'
                onClick={(e) => {
                  e.stopPropagation()
                  if (updatePremiumContentFields && !!accountUserId) {
                    updatePremiumContentFields(
                      { follow_user_id: accountUserId },
                      AvailabilityType.SPECIAL_ACCESS
                    )
                  }
                }}
              />
              <div>{messages.followersOnly}</div>
            </label>
            <label
              className={cn(styles.radioItem, styles.specialAccessRadioItem, {
                [styles.selected]:
                  !!metadataState.premium_conditions?.tip_user_id
              })}
            >
              <input
                className={styles.radioInput}
                type='radio'
                name='special-access'
                value='supporter'
                onClick={(e) => {
                  e.stopPropagation()
                  if (updatePremiumContentFields && !!accountUserId) {
                    updatePremiumContentFields(
                      { tip_user_id: accountUserId },
                      AvailabilityType.SPECIAL_ACCESS
                    )
                  }
                }}
              />
              <div>
                {messages.supportersOnly}
                <Tooltip
                  text={messages.supportersInfo}
                  mouseEnterDelay={0.1}
                  mount='body'
                >
                  <IconInfo className={styles.supportersInfo} />
                </Tooltip>
              </div>
            </label>
          </div>
        )}
      </div>
    </div>
  )
}
