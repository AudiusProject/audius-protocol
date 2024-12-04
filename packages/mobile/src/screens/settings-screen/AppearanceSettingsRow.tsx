import { useCallback } from 'react'

import { useSelectTierInfo } from '@audius/common/hooks'
import { settingsMessages as messages } from '@audius/common/messages'
import { Name, Theme } from '@audius/common/models'
import {
  accountSelectors,
  themeActions,
  themeSelectors
} from '@audius/common/store'
import { useDispatch, useSelector } from 'react-redux'

import { IconAppearance } from '@audius/harmony-native'
import { SegmentedControl } from 'app/components/core'
import { env } from 'app/env'
import { make, track } from 'app/services/analytics'

import { SettingsRowLabel } from './SettingRowLabel'
import { SettingsRow } from './SettingsRow'
import { SettingsRowContent } from './SettingsRowContent'
import { SettingsRowDescription } from './SettingsRowDescription'
const { getUserId } = accountSelectors
const { setTheme } = themeActions
const { getTheme } = themeSelectors

const isStaging = env.ENVIRONMENT === 'staging'

export const AppearanceSettingsRow = () => {
  const theme = useSelector(getTheme)
  const accountId = useSelector(getUserId)
  const dispatch = useDispatch()

  const { tier } = useSelectTierInfo(accountId ?? 0)

  const appearanceOptions = [
    { key: Theme.DEFAULT, text: messages.lightMode },
    { key: Theme.AUTO, text: messages.autoMode },
    { key: Theme.DARK, text: messages.darkMode }
  ]

  if (tier === 'gold' || tier === 'platinum' || isStaging) {
    appearanceOptions.push({ key: Theme.MATRIX, text: messages.matrixMode })
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
      <SettingsRowLabel
        label={messages.appearanceTitle}
        icon={IconAppearance}
      />
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
