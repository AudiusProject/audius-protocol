import { useCallback } from 'react'

import type { CastMethod } from '@audius/common'
import { accountSelectors, castSelectors, castActions } from '@audius/common'

import Appearance from 'app/assets/images/emojis/waning-crescent-moon.png'
import { SegmentedControl } from 'app/components/core'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { SettingsRowLabel } from './SettingRowLabel'
import { SettingsRow } from './SettingsRow'
import { SettingsRowContent } from './SettingsRowContent'
import { SettingsRowDescription } from './SettingsRowDescription'
const { updateMethod } = castActions
const { getMethod: getCastMethod } = castSelectors
const getAccountUser = accountSelectors.getAccountUser

const messages = {
  cast: 'Cast to Devices',
  castDescription: 'Select your preferred casting method',
  airplay: 'Airplay',
  chromecast: 'Chromecast'
}

export const CastSettingsRow = () => {
  const dispatchWeb = useDispatchWeb()
  const accountUser = useSelectorWeb(getAccountUser)
  const castMethod = useSelectorWeb(getCastMethod)

  const setCastMethod = useCallback(
    (method: CastMethod) => {
      // Changes should be persisted to async storage so that the
      // settings row value persists between sessions.
      dispatchWeb(updateMethod({ method, persist: true }))
    },
    [dispatchWeb]
  )

  if (!accountUser) return null

  const castOptions = [
    { key: 'airplay', text: messages.airplay },
    { key: 'chromecast', text: messages.chromecast }
  ]

  return (
    <SettingsRow>
      <SettingsRowLabel label={messages.cast} iconSource={Appearance} />
      <SettingsRowDescription>
        {messages.castDescription}
      </SettingsRowDescription>
      <SettingsRowContent>
        <SegmentedControl
          fullWidth
          options={castOptions}
          defaultSelected={castMethod}
          onSelectOption={setCastMethod}
        />
      </SettingsRowContent>
    </SettingsRow>
  )
}
