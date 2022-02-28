import { useContext } from 'react'

import { getAccountUser } from 'audius-client/src/common/store/account/selectors'

import Appearance from 'app/assets/images/emojis/waning-crescent-moon.png'
import { getUserAudioTier } from 'app/components/audio-rewards'
import { SegmentedControl } from 'app/components/core'
import { ThemeContext } from 'app/components/theme/ThemeContext'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { Theme } from 'app/utils/theme'

import { SettingsRowLabel } from './SettingRowLabel'
import { SettingsRow } from './SettingsRow'
import { SettingsRowContent } from './SettingsRowContent'
import { SettingsRowDescription } from './SettingsRowDescription'

const messages = {
  appearance: 'Appearance',
  appearanceDescription:
    "Enable dark mode or choose 'Auto' to change with your system settings",
  auto: 'Auto',
  dark: 'Dark',
  light: 'Light',
  matrix: 'Matrix'
}

export const AppearanceSettingsRow = () => {
  const { theme, setTheme } = useContext(ThemeContext)
  const accountUser = useSelectorWeb(getAccountUser)

  if (!accountUser) return null

  const tier = getUserAudioTier(accountUser)

  const appearanceOptions = [
    { key: Theme.AUTO, text: messages.auto },
    { key: Theme.DARK, text: messages.dark },
    { key: Theme.DEFAULT, text: messages.light }
  ]

  if (tier === 'gold' || tier === 'platinum') {
    appearanceOptions.push({ key: Theme.MATRIX, text: messages.matrix })
  }

  return (
    <SettingsRow>
      <SettingsRowLabel label={messages.appearance} iconSource={Appearance} />
      <SettingsRowDescription>
        {messages.appearanceDescription}
      </SettingsRowDescription>
      <SettingsRowContent>
        <SegmentedControl
          fullWidth
          options={appearanceOptions}
          defaultSelected={theme}
          onSelectOption={setTheme}
        />
      </SettingsRowContent>
    </SettingsRow>
  )
}
