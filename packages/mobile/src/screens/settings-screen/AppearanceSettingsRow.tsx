import { useCallback } from 'react'

import {
  accountSelectors,
  Name,
  themeActions,
  themeSelectors,
  useSelectTierInfo
} from '@audius/common'
import { useDispatch, useSelector } from 'react-redux'

import IconAppearance from 'app/assets/images/iconAppearance.svg'
import { SegmentedControl } from 'app/components/core'
import { make, track } from 'app/services/analytics'
import { Theme } from 'app/utils/theme'

import { SettingsRowLabel } from './SettingRowLabel'
import { SettingsRow } from './SettingsRow'
import { SettingsRowContent } from './SettingsRowContent'
import { SettingsRowDescription } from './SettingsRowDescription'
import { env } from 'app/env'
const { getUserId } = accountSelectors
const { setTheme } = themeActions
const { getTheme } = themeSelectors

const isStaging = env.ENVIRONMENT === 'staging'

const messages = {
  appearance: 'Appearance',
  appearanceDescription:
    "Enable dark mode or choose 'Auto' to change with your system settings",
  auto: 'Auto',
  dark: 'Dark',
  default: 'Default',
  matrix: 'Matrix'
}

export const AppearanceSettingsRow = () => {
  const theme = useSelector(getTheme)
  const accountId = useSelector(getUserId)
  const dispatch = useDispatch()

  const { tier } = useSelectTierInfo(accountId ?? 0)

  const appearanceOptions = [
    { key: Theme.DEFAULT, text: messages.default },
    { key: Theme.AUTO, text: messages.auto },
    { key: Theme.DARK, text: messages.dark }
  ]

  if (tier === 'gold' || tier === 'platinum' || isStaging) {
    appearanceOptions.push({ key: Theme.MATRIX, text: messages.matrix })
  }

  const handleSetTheme = useCallback(
    (theme: Theme) => {
      dispatch(setTheme({ theme }))

      const recordedTheme =
        theme === Theme.DEFAULT ? 'light' : theme.toLocaleLowerCase()

      const trackEvent = make({
        eventName: Name.SETTINGS_CHANGE_THEME,
        mode: recordedTheme as 'dark' | 'light' | 'matrix' | 'auto'
      })

      track(trackEvent)
    },
    [dispatch]
  )

  return (
    <SettingsRow>
      <SettingsRowLabel label={messages.appearance} icon={IconAppearance} />
      <SettingsRowDescription>
        {messages.appearanceDescription}
      </SettingsRowDescription>
      <SettingsRowContent>
        <SegmentedControl
          fullWidth
          options={appearanceOptions}
          defaultSelected={theme ?? Theme.DEFAULT}
          onSelectOption={handleSetTheme}
        />
      </SettingsRowContent>
    </SettingsRow>
  )
}
