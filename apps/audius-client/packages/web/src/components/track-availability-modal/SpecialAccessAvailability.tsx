import { ChangeEvent, useCallback } from 'react'

import { accountSelectors, TrackAvailabilityType } from '@audius/common'
import { IconInfo, RadioButton, RadioButtonGroup } from '@audius/stems'
import { useSelector } from 'react-redux'

import Tooltip from 'components/tooltip/Tooltip'

import styles from './SpecialAccessAvailability.module.css'
import { TrackAvailabilitySelectionProps } from './types'

const { getUserId } = accountSelectors

const messages = {
  followersOnly: 'Available to Followers Only',
  supportersOnly: 'Available to Supporters Only',
  supportersInfo: 'Supporters are users who have sent you a tip'
}

enum SpecialAccessType {
  TIP = 'tip',
  FOLLOW = 'follow'
}

export const SpecialAccessAvailability = ({
  state,
  onStateUpdate
}: TrackAvailabilitySelectionProps) => {
  const accountUserId = useSelector(getUserId)
  const specialAccessType = state.premium_conditions?.tip_user_id
    ? SpecialAccessType.TIP
    : SpecialAccessType.FOLLOW

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
      <label className={styles.row}>
        <RadioButton
          className={styles.radio}
          value={SpecialAccessType.FOLLOW}
        />
        {messages.followersOnly}
      </label>
      <label className={styles.row}>
        <RadioButton className={styles.radio} value={SpecialAccessType.TIP} />
        {messages.supportersOnly}
        <Tooltip
          text={messages.supportersInfo}
          mouseEnterDelay={0.1}
          mount={'parent'}
        >
          <IconInfo className={styles.icon} />
        </Tooltip>
      </label>
    </RadioButtonGroup>
  )
}
