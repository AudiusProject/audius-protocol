import { useMemo } from 'react'

import { useSelector } from 'react-redux'

import {
  AllRemoteConfigKeys,
  BooleanKeys,
  IntKeys,
  DoubleKeys,
  StringKeys,
  RemoteConfigInstance
} from 'common/services/remote-config'
import { isRemoteConfigLoaded } from 'common/store/remote-config/selectors'

export const createUseRemoteVarHook = (
  remoteConfigInstance: RemoteConfigInstance
) => {
  function useRemoteVar(key: IntKeys): number
  function useRemoteVar(key: DoubleKeys): number
  function useRemoteVar(key: StringKeys): string
  function useRemoteVar(key: BooleanKeys): boolean
  function useRemoteVar(
    key: AllRemoteConfigKeys
  ): boolean | string | number | null {
    const configLoaded = useSelector(isRemoteConfigLoaded)
    // eslint complains about configLoaded as part of the deps array
    // eslint-disable-next-line
    const remoteVar = useMemo(() => remoteConfigInstance.getRemoteVar(key), [
      key,
      configLoaded,
      remoteConfigInstance
    ])
    return remoteVar
  }

  return useRemoteVar
}
