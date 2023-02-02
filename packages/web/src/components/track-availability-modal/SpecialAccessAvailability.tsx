import { accountSelectors, TrackAvailabilityType } from '@audius/common'
import { IconInfo, IconSpecialAccess } from '@audius/stems'
import cn from 'classnames'
import { useSelector } from 'react-redux'

import { ModalRadioGroup } from 'components/modal-radio/ModalRadioGroup'
import { ModalRadioItem } from 'components/modal-radio/ModalRadioItem'
import Tooltip from 'components/tooltip/Tooltip'

import styles from './TrackAvailabilityModal.module.css'
import { TrackAvailabilitySelectionProps } from './types'

const { getUserId } = accountSelectors

const messages = {
  specialAccess: 'Special Access',
  specialAccessSubtitle:
    'Special Access tracks are only available to users who meet certain criteria, such as following the artist.',
  followersOnly: 'Available to Followers Only',
  supportersOnly: 'Available to Supporters Only',
  supportersInfo: 'Supporters are users who have sent you a tip'
}

export const SpecialAccessAvailability = ({
  selected,
  state,
  onStateUpdate,
  disabled = false
}: TrackAvailabilitySelectionProps) => {
  const accountUserId = useSelector(getUserId)

  const radioItems = [
    <ModalRadioItem
      key='follow'
      selected={!!state.premium_conditions?.follow_user_id}
      onClick={(e) => {
        e.stopPropagation()
        if (accountUserId) {
          onStateUpdate(
            { follow_user_id: accountUserId },
            TrackAvailabilityType.SPECIAL_ACCESS
          )
        }
      }}
      className={styles.specialAccessRadioItem}
    >
      <div>{messages.followersOnly}</div>
    </ModalRadioItem>,
    <ModalRadioItem
      key='tip'
      selected={!!state.premium_conditions?.tip_user_id}
      onClick={(e) => {
        e.stopPropagation()
        if (accountUserId) {
          onStateUpdate(
            { tip_user_id: accountUserId },
            TrackAvailabilityType.SPECIAL_ACCESS
          )
        }
      }}
      className={styles.specialAccessRadioItem}
    >
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
    </ModalRadioItem>
  ]

  return (
    <div>
      <div
        className={cn(styles.availabilityRowTitle, {
          [styles.selected]: selected,
          [styles.disabled]: disabled
        })}
      >
        <IconSpecialAccess className={styles.availabilityRowIcon} />
        <span>{messages.specialAccess}</span>
      </div>
      <div className={styles.availabilityRowDescription}>
        {messages.specialAccessSubtitle}
      </div>
      {selected && (
        <div className={styles.availabilityRowSelection}>
          <ModalRadioGroup items={radioItems} />
        </div>
      )}
    </div>
  )
}
