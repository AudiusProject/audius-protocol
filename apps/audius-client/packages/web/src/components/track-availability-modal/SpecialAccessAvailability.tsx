import { ChangeEvent, useCallback } from 'react'

import {
  accountSelectors,
  isPremiumContentFollowGated,
  TrackAvailabilityType
} from '@audius/common'
import { IconInfo, RadioButton, RadioButtonGroup } from '@audius/stems'
import cn from 'classnames'
import { useSelector } from 'react-redux'

import Tooltip from 'components/tooltip/Tooltip'

import styles from './SpecialAccessAvailability.module.css'
import { TrackAvailabilitySelectionProps } from './types'

const { getUserId } = accountSelectors

const messages = {
  followersOnly: 'Available to Followers Only',
  supportersOnly: 'Available to Supporters Only',
  supportersInfo: 'Supporters are users who have sent you a tip.'
}

enum SpecialAccessType {
  TIP = 'tip',
  FOLLOW = 'follow'
}

export const SpecialAccessAvailability = ({
  state,
  onStateUpdate,
  disabled
}: TrackAvailabilitySelectionProps) => {
  const accountUserId = useSelector(getUserId)
  const specialAccessType = isPremiumContentFollowGated(
    state.premium_conditions
  )
    ? SpecialAccessType.FOLLOW
    : SpecialAccessType.TIP

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const type = e.target.value as SpecialAccessType
      if (accountUserId) {
        if (type === SpecialAccessType.FOLLOW) {
          onStateUpdate(
            { follow_user_id: accountUserId },
            TrackAvailabilityType.SPECIAL_ACCESS
          )
        } else if (type === SpecialAccessType.TIP) {
          onStateUpdate(
            { tip_user_id: accountUserId },
            TrackAvailabilityType.SPECIAL_ACCESS
          )
        }
      }
    },
    [onStateUpdate, accountUserId]
  )

  return (
    <RadioButtonGroup
      className={styles.root}
      name={'special-access-type'}
      onChange={handleChange}
      value={specialAccessType}
    >
      <label className={cn(styles.row, { [styles.disabled]: disabled })}>
        <RadioButton
          className={styles.radio}
          value={SpecialAccessType.FOLLOW}
          disabled={disabled}
        />
        <span>{messages.followersOnly}</span>
      </label>
      <label className={cn(styles.row, { [styles.disabled]: disabled })}>
        <RadioButton
          className={styles.radio}
          value={SpecialAccessType.TIP}
          disabled={disabled}
        />
        <span>{messages.supportersOnly}</span>
        <Tooltip
          className={styles.tooltip}
          text={messages.supportersInfo}
          mouseEnterDelay={0.1}
          mount={'parent'}
          color='--secondary'
        >
          <IconInfo className={styles.icon} />
        </Tooltip>
      </label>
    </RadioButtonGroup>
  )
}
