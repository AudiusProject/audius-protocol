import { useMemo } from 'react'

import {
  AllRemoteConfigKeys,
  BooleanKeys,
  IntKeys,
  DoubleKeys,
  StringKeys,
  RemoteConfigInstance
} from '@audius/common'
import { useSelector } from 'react-redux'

import { isRemoteConfigLoaded } from 'common/store/remote-config/selectors'
import { StateWithRemoteConfig } from 'common/store/remote-config/slice'

export const createUseRemoteVarHook = <State extends StateWithRemoteConfig>(
  remoteConfigInstance: RemoteConfigInstance
) => {
  function useRemoteVar(key: IntKeys): number
  function useRemoteVar(key: DoubleKeys): number
  function useRemoteVar(key: StringKeys): string
  function useRemoteVar(key: BooleanKeys): boolean
  function useRemoteVar(
    key: AllRemoteConfigKeys
  ): boolean | string | number | null {
    const configLoaded = useSelector((state: State) =>
      isRemoteConfigLoaded<State>(state)
    )

    const remoteVar = useMemo(
      () => remoteConfigInstance.getRemoteVar(key),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [key, configLoaded, remoteConfigInstance]
    )
    return remoteVar
  }

  return useRemoteVar
}
