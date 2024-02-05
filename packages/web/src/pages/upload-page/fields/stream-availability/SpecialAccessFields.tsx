import { ChangeEvent, useCallback } from 'react'

import { useFeatureFlag } from '@audius/common/hooks'
import { AccessConditions } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { accountSelectors } from '@audius/common/store'
import { Nullable } from '@audius/common/utils'
import { IconInfo } from '@audius/harmony'
import { RadioButton, RadioButtonGroup } from '@audius/stems'
import cn from 'classnames'
import { useField } from 'formik'
import { useSelector } from 'react-redux'

import { HelpCallout } from 'components/help-callout/HelpCallout'
import Tooltip from 'components/tooltip/Tooltip'
import { Text } from 'components/typography'

import {
  AccessAndSaleFormValues,
  DOWNLOAD_CONDITIONS,
  STREAM_CONDITIONS,
  SpecialAccessType
} from '../types'

import styles from './SpecialAccessFields.module.css'

const { getUserId } = accountSelectors

const messages = {
  followersOnly: 'Available to Followers Only',
  supportersOnly: 'Available to Supporters Only',
  supportersInfo: 'Supporters are users who have sent you a tip.',
  premiumDownloads:
    'Setting your track to Special Access will remove the availability you set on your premium downloads. Don’t worry, your stems are still saved!'
}

type TrackAvailabilityFieldsProps = {
  disabled?: boolean
}

const SPECIAL_ACCESS_TYPE = 'special_access_type'

export const SpecialAccessFields = (props: TrackAvailabilityFieldsProps) => {
  const { disabled } = props
  const accountUserId = useSelector(getUserId)
  const [specialAccessTypeField] = useField({
    name: SPECIAL_ACCESS_TYPE
  })

  const [, , { setValue: setStreamConditionsValue }] =
    useField<AccessAndSaleFormValues[typeof STREAM_CONDITIONS]>(
      STREAM_CONDITIONS
    )
  const [{ value: downloadConditions }] =
    useField<Nullable<AccessConditions>>(DOWNLOAD_CONDITIONS)
  const { isEnabled: isLosslessDownloadsEnabled } = useFeatureFlag(
    FeatureFlags.LOSSLESS_DOWNLOADS_ENABLED
  )

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const type = e.target.value as SpecialAccessType
      if (accountUserId) {
        if (type === SpecialAccessType.FOLLOW) {
          setStreamConditionsValue({
            follow_user_id: accountUserId
          })
        } else if (type === SpecialAccessType.TIP) {
          setStreamConditionsValue({
            tip_user_id: accountUserId
          })
        }
      }
      specialAccessTypeField.onChange(e)
    },
    [accountUserId, setStreamConditionsValue, specialAccessTypeField]
  )

  return (
    <>
      <RadioButtonGroup
        className={styles.root}
        {...specialAccessTypeField}
        onChange={handleChange}
        defaultValue={SpecialAccessType.FOLLOW}
      >
        <label className={cn(styles.row, { [styles.disabled]: disabled })}>
          <RadioButton
            className={styles.radio}
            value={SpecialAccessType.FOLLOW}
            disabled={disabled}
          />
          <Text>{messages.followersOnly}</Text>
        </label>
        <label className={cn(styles.row, { [styles.disabled]: disabled })}>
          <RadioButton
            className={styles.radio}
            value={SpecialAccessType.TIP}
            disabled={disabled}
          />
          <Text>{messages.supportersOnly}</Text>
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
      {isLosslessDownloadsEnabled && downloadConditions ? (
        <HelpCallout icon={<IconInfo />} content={messages.premiumDownloads} />
      ) : null}
    </>
  )
}
