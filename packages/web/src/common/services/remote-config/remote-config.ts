import { ID } from '@audius/common'
import optimizely from '@optimizely/optimizely-sdk'

import {
  remoteConfigIntDefaults,
  remoteConfigStringDefaults,
  remoteConfigDoubleDefaults,
  remoteConfigBooleanDefaults
} from 'common/services/remote-config/defaults'
import {
  FeatureFlags,
  flagDefaults,
  flagCohortType,
  FeatureFlagCohortType
} from 'common/services/remote-config/feature-flags'
import {
  IntKeys,
  StringKeys,
  DoubleKeys,
  BooleanKeys,
  AllRemoteConfigKeys
} from 'common/services/remote-config/types'
import { Nullable } from 'common/utils/typeUtils'
import { uuid } from 'common/utils/uid'

export const USER_ID_AVAILABLE_EVENT = 'USER_ID_AVAILABLE_EVENT'

// Constants
// All optimizely feature keys are lowercase_snake
const REMOTE_CONFIG_FEATURE_KEY = 'remote_config'

// Internal State
type State = {
  didInitialize: boolean
  userId: Nullable<string>
  sessionId: Nullable<string>
  initializationCallbacks: (() => void)[]
}

type RemoteConfigOptions<Client> = {
  createOptimizelyClient: () => Promise<Client>
  getFeatureFlagSessionId: () => Promise<string | null>
  setFeatureFlagSessionId: (id: string) => Promise<void>
  setLogLevel: () => void
}

export const remoteConfig = <
  Client extends Pick<
    optimizely.Client,
    | 'getFeatureVariableBoolean'
    | 'getFeatureVariableDouble'
    | 'getFeatureVariableInteger'
    | 'getFeatureVariableString'
    | 'isFeatureEnabled'
    | 'onReady'
  >
>({
  createOptimizelyClient,
  getFeatureFlagSessionId,
  setFeatureFlagSessionId,
  setLogLevel
}: RemoteConfigOptions<Client>) => {
  // Uncomment to time remote config
  // console.time('remote-config')

  const state: State = {
    didInitialize: false,
    userId: null,
    sessionId: null,
    initializationCallbacks: []
  }

  setLogLevel()

  // Optimizely client
  let client: Client | undefined

  async function init() {
    // Set sessionId for feature flag bucketing
    const savedSessionId = await getFeatureFlagSessionId()
    if (!savedSessionId) {
      const newSessionId = uuid()
      setFeatureFlagSessionId(newSessionId)
      state.sessionId = newSessionId
    } else {
      state.sessionId = savedSessionId
    }

    client = await createOptimizelyClient()

    client.onReady().then(() => {
      state.didInitialize = true

      // Call initializationCallbacks
      state.initializationCallbacks.forEach((cb) => cb())
      state.initializationCallbacks = []

      // console.timeEnd('remote-config')
    })
  }

  // API

  /**
   * Register a callback for client ready.
   * @param func
   */
  function onClientReady(func: () => void) {
    if (state.didInitialize) {
      func()
    } else {
      state.initializationCallbacks = [...state.initializationCallbacks, func]
    }
  }

  /**
   * Set the userId for calls to Optimizely.
   * Prior to calling, uses the ANONYMOUS_USER_ID constant.
   * @param userId
   */
  function setUserId(userId: ID) {
    state.userId = userId.toString()
  }

  /**
   * Access a remotely configured value.
   * @param key
   */
  function getRemoteVar(key: BooleanKeys): boolean | null
  function getRemoteVar(key: StringKeys): string | null
  function getRemoteVar(key: IntKeys): number | null
  function getRemoteVar(key: DoubleKeys): number | null
  function getRemoteVar(
    key: AllRemoteConfigKeys
  ): number | string | boolean | null
  function getRemoteVar(
    key: AllRemoteConfigKeys
  ): number | string | boolean | null {
    // If the client is not ready yet, return early with `null`
    if (!client) return null

    // If userId is null, set to string default. This will effectively capture all users as intended for remote config
    const id = state.userId || 'ANONYMOUS_USER'

    if (isIntKey(key)) {
      return getValue(
        remoteConfigIntDefaults,
        key,
        id,
        client.getFeatureVariableInteger.bind(client)
      )
    }

    // TODO: We can take out the keyof typeof garbage
    // once all the enums have keys.
    if (isStringKey(key)) {
      return getValue(
        remoteConfigStringDefaults,
        key as unknown as string,
        id,
        client.getFeatureVariableString.bind(client)
      )
    }

    if (isDoubleKey(key)) {
      return getValue(
        remoteConfigDoubleDefaults,
        key as unknown as string,
        id,
        client.getFeatureVariableDouble.bind(client)
      )
    }

    return getValue(
      remoteConfigBooleanDefaults,
      key as unknown as string,
      id,
      client.getFeatureVariableBoolean.bind(client)
    )
  }

  /**
   * Gets whether a given feature flag is enabled.
   * @param flag
   */
  function getFeatureEnabled(flag: FeatureFlags) {
    // If the client is not ready yet, return early with `null`
    if (!client) return null

    const defaultVal = flagDefaults[flag]

    // Set the unique identifier as the userId or sessionId
    // depending on the feature flag
    let id: string
    const cohortType = flagCohortType[flag]
    switch (cohortType) {
      case FeatureFlagCohortType.USER_ID: {
        // If the id is anonymous, do not enable feature
        if (!state.userId) return false
        id = state.userId
        break
      }
      case FeatureFlagCohortType.SESSION_ID: {
        id = state.sessionId!
        break
      }
    }

    try {
      const enabled = state.didInitialize
        ? client.isFeatureEnabled(flag as unknown as string, id) ?? defaultVal
        : defaultVal
      return enabled
    } catch (err) {
      return defaultVal
    }
  }

  const waitForRemoteConfig = async () => {
    await new Promise<void>((resolve) => onClientReady(() => resolve()))
  }

  /**
   * Need this function for feature flags that depend on user id.
   * This is because the waitForRemoteConfig does not ensure that
   * user id is available before its promise resolution, meaning
   * that it will sometimes return false for a feature flag
   * that is enabled and supposed to return true.
   */
  const waitForUserRemoteConfig = async () => {
    if (state.userId) {
      await new Promise<void>((resolve) => onClientReady(resolve))
      return
    }
    await new Promise<void>((resolve) => {
      if (state.userId) {
        onClientReady(resolve)
      } else {
        window.addEventListener(USER_ID_AVAILABLE_EVENT, () =>
          onClientReady(resolve)
        )
      }
    })
  }

  // Type predicates
  function isIntKey(key: AllRemoteConfigKeys): key is IntKeys {
    return !!Object.values(IntKeys).find((x) => x === key)
  }
  function isStringKey(key: AllRemoteConfigKeys): key is StringKeys {
    return !!Object.values(StringKeys).find((x) => x === key)
  }
  function isDoubleKey(key: AllRemoteConfigKeys): key is DoubleKeys {
    return !!Object.values(DoubleKeys).find((x) => x === key)
  }

  // Removes some boilerplate around getting values, falling back to defaults,
  // calling the correct client fn.
  function getValue<T>(
    defaults: { [id: string]: T },
    varKey: string,
    userId: string,
    getFn: (featureKey: string, variableKey: string, userId: string) => T | null
  ): T {
    const defaultVal = defaults[varKey]
    if (!state.didInitialize) return defaultVal
    return getFn(REMOTE_CONFIG_FEATURE_KEY, varKey, userId) ?? defaultVal
  }

  return {
    getFeatureEnabled,
    getRemoteVar,
    init,
    onClientReady,
    setUserId,
    waitForRemoteConfig,
    waitForUserRemoteConfig
  }
}

export type RemoteConfigInstance = ReturnType<typeof remoteConfig>
