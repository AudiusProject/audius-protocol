import { useCallback } from 'react'

import { togglePushNotificationSetting } from 'audius-client/src/common/store/pages/settings/actions'
import { getPushNotificationSettings } from 'audius-client/src/common/store/pages/settings/selectors'
import { PushNotificationSetting } from 'audius-client/src/common/store/pages/settings/types'
import { View } from 'react-native'

import { Switch } from 'app/components/core'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'

import { SettingsRowLabel } from './SettingRowLabel'
import { SettingsRow } from './SettingsRow'

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
  const notificationSettings = useSelectorWeb(getPushNotificationSettings)
  const dispatchWeb = useDispatchWeb()

  const isMobilePushEnabled =
    notificationSettings[PushNotificationSetting.MobilePush]

  const isMobilePushSetting = type === PushNotificationSetting.MobilePush

  const isDisabled = !isMobilePushEnabled && !isMobilePushSetting

  const value = isDisabled ? false : notificationSettings[type]

  const handleValueChange = useCallback(
    (value: boolean) => {
      dispatchWeb(togglePushNotificationSetting(type, value))
    },
    [dispatchWeb, type]
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
