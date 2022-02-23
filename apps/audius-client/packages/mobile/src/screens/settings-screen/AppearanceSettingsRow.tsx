import Appearance from 'app/assets/images/emojis/waning-crescent-moon.png'
import { SegmentedControl } from 'app/components/core'

import { SettingsRowLabel } from './SettingRowLabel'
import { SettingsRow } from './SettingsRow'
import { SettingsRowDescription } from './SettingsRowDescription'

const messages = {
  appearance: 'Appearance',
  appearanceDescription:
    "Enable dark mode or choose 'Auto' to change with your system settings",
  auto: 'Auto',
  dark: 'Dark',
  light: 'Light'
}

export const AppearanceSettingsRow = () => {
  return (
    <SettingsRow>
      <SettingsRowLabel label={messages.appearance} iconSource={Appearance} />
      <SettingsRowDescription>
        {messages.appearanceDescription}
      </SettingsRowDescription>
      <SegmentedControl
        style={{ marginTop: 8 }}
        fullWidth
        options={[
          { key: 'auto', text: messages.auto },
          { key: 'dark', text: messages.dark },
          { key: 'light', text: messages.light }
        ]}
        defaultSelected='auto'
        onSelectOption={() => {}}
      />
    </SettingsRow>
  )
}
