import { useMemo } from 'react'

import { StringKeys } from 'services/remote-config'
import { parseIntList } from 'utils/stringUtils'

import { useRemoteVar } from '../useRemoteVar'

import { PayExtraAmountPresetValues, PayExtraPreset } from './types'

/** Extracts and parses the Pay Extra presets from remote config */
export const usePayExtraPresets = (key: StringKeys) => {
  const configValue = useRemoteVar(key)
  return useMemo<PayExtraAmountPresetValues>(() => {
    const [low, medium, high] = parseIntList(configValue)
    return {
      [PayExtraPreset.LOW]: low,
      [PayExtraPreset.MEDIUM]: medium,
      [PayExtraPreset.HIGH]: high
    }
  }, [configValue])
}
