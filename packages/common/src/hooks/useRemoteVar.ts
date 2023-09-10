import { useMemo } from 'react'

import {
  AllRemoteConfigKeys,
  BooleanKeys,
  IntKeys,
  DoubleKeys,
  StringKeys,
  RemoteConfigInstance
} from '../services'

import { useRecomputeToggle } from './useFeatureFlag'

export const createUseRemoteVarHook = ({
  remoteConfigInstance,
  useHasAccount,
  useHasConfigLoaded
}: {
  remoteConfigInstance: RemoteConfigInstance
  useHasAccount: () => boolean
  useHasConfigLoaded: () => boolean
}) => {
  function useRemoteVar(key: IntKeys): number
  function useRemoteVar(key: DoubleKeys): number
  function useRemoteVar(key: StringKeys): string
  function useRemoteVar(key: BooleanKeys): boolean
  function useRemoteVar(
    key: AllRemoteConfigKeys
  ): boolean | string | number | null {
    const configLoaded = useHasConfigLoaded()
    const shouldRecompute = useRecomputeToggle(
      useHasAccount,
      configLoaded,
      remoteConfigInstance
    )

    const remoteVar = useMemo(
      () => remoteConfigInstance.getRemoteVar(key),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [key, shouldRecompute, remoteConfigInstance]
    )
    return remoteVar
  }

  return useRemoteVar
}
