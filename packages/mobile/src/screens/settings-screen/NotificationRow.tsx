import {
  settingsPageSelectors,
  settingsPageActions,
  PushNotificationSetting
} from '@audius/common/store'
import { useCallback } from 'react'

import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { Switch } from 'app/components/core'
import { makeStyles } from 'app/styles'

import { SettingsRowLabel } from './SettingRowLabel'
import { SettingsRow } from './SettingsRow'
const { getPushNotificationSettings } = settingsPageSelectors
const { togglePushNotificationSetting } = settingsPageActions

const useStyles = makeStyles(({ palette }) => ({
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  labelOff: {
    color: palette.neutralLight4
  }
}))

type NotficationRowProps = {
  label: string
  type: PushNotificationSetting
}

export const NotificationRow = (props: NotficationRowProps) => {
  const { label, type } = props
  const styles = useStyles()
  const notificationSettings = useSelector(getPushNotificationSettings)
  const dispatch = useDispatch()

  const isMobilePushEnabled =
    notificationSettings[PushNotificationSetting.MobilePush]

  const isMobilePushSetting = type === PushNotificationSetting.MobilePush

  const isDisabled = !isMobilePushEnabled && !isMobilePushSetting

  const value = isDisabled ? false : notificationSettings[type]

  const handleValueChange = useCallback(
    (value: boolean) => {
      dispatch(togglePushNotificationSetting(type, value))
    },
    [dispatch, type]
  )

  return (
    <SettingsRow>
      <View style={styles.content}>
        <SettingsRowLabel
          label={label}
          styles={{ label: value ? {} : styles.labelOff }}
        />
        <Switch
          disabled={isDisabled}
          onValueChange={handleValueChange}
          value={value}
        />
      </View>
    </SettingsRow>
  )
}
