import { useCallback } from 'react'

import type { CastMethod } from '@audius/common/store'
import {
  accountSelectors,
  castSelectors,
  castActions
} from '@audius/common/store'
import { useDispatch, useSelector } from 'react-redux'

import { IconVolumeLevel2 } from '@audius/harmony-native'
import { SegmentedControl } from 'app/components/core'

import { SettingsRowLabel } from './SettingRowLabel'
import { SettingsRow } from './SettingsRow'
import { SettingsRowContent } from './SettingsRowContent'
import { SettingsRowDescription } from './SettingsRowDescription'
const { updateMethod } = castActions
const { getMethod: getCastMethod } = castSelectors
const { getAccountUser } = accountSelectors

const messages = {
  cast: 'Cast to Devices',
  castDescription:
    'Enable casting to devices that support Chromecast. Airplay will still be available, but will require a few extra taps.',
  airplay: 'Airplay',
  chromecast: 'Chromecast'
}

export const CastSettingsRow = () => {
  const dispatch = useDispatch()
  const accountUser = useSelector(getAccountUser)
  const castMethod = useSelector(getCastMethod)

  const setCastMethod = useCallback(
    (method: CastMethod) => {
      // Changes should be persisted to async storage so that the
      // settings row value persists between sessions.
      dispatch(updateMethod({ method, persist: true }))
    },
    [dispatch]
  )

  if (!accountUser) return null

  const castOptions = [
    { key: 'airplay', text: messages.airplay },
    { key: 'chromecast', text: messages.chromecast }
  ]

  return (
    <SettingsRow>
      <SettingsRowLabel label={messages.cast} icon={IconVolumeLevel2} />
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
