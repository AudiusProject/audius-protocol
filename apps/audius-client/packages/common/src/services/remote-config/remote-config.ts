import { EventEmitter } from 'events'

import optimizely from '@optimizely/optimizely-sdk'

import { ID } from 'models'
import { Nullable } from 'utils'

import {
  remoteConfigIntDefaults,
  remoteConfigStringDefaults,
  remoteConfigDoubleDefaults,
  remoteConfigBooleanDefaults
} from './defaults'
import { FeatureFlags, flagDefaults } from './feature-flags'
import {
  IntKeys,
  StringKeys,
  DoubleKeys,
  BooleanKeys,
  AllRemoteConfigKeys
} from './types'

export const USER_ID_AVAILABLE_EVENT = 'USER_ID_AVAILABLE_EVENT'

// Constants
// All optimizely feature keys are lowercase_snake
const REMOTE_CONFIG_FEATURE_KEY = 'remote_config'

// Internal State
type State = {
  didInitialize: boolean
  id: Nullable<number>
  initializationCallbacks: (() => void)[]
}

export type RemoteConfigOptions<Client> = {
  createOptimizelyClient: () => Promise<Client>
  getFeatureFlagSessionId: () => Promise<Nullable<number>>
  setFeatureFlagSessionId: (id: number) => Promise<void>
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
  const state: State = {
    didInitialize: false,
    id: null,
    initializationCallbacks: []
  }

  setLogLevel()

  // Optimizely client
  let client: Client | undefined

  async function init() {
    // Set sessionId for feature flag bucketing
    const savedSessionId = await getFeatureFlagSessionId()
    if (!savedSessionId) {
      const newSessionId = generateSessionId()
      setFeatureFlagSessionId(newSessionId)
      state.id = newSessionId
    } else {
      state.id = savedSessionId
    }

    client = await createOptimizelyClient()

    client.onReady().then(() => {
      state.didInitialize = true

      // Call initializationCallbacks
      state.initializationCallbacks.forEach((cb) => cb())
      state.initializationCallbacks = []
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

  // Use event emission to track setUser events
  const emitter = new EventEmitter()

  /**
   * Set the userId for calls to Optimizely.
   * Prior to calling, uses the ANONYMOUS_USER_ID constant.
   * @param userId
   */
  function setUserId(userId: ID) {
    state.id = userId
    emitter.emit('setUserId')
  }

  /**
   * API for listening to setUser events
   */
  function listenForUserId(cb: () => void | Promise<void>) {
    emitter.addListener('setUserId', cb)
  }

  /**
   * API to unlisten to setUser events
   */
  function unlistenForUserId(cb: () => void | Promise<void>) {
    emitter.removeListener('setUserId', cb)
  }

  /**
   * Access a remotely configured value.
   * @param key
   */
  function getRemoteVar(key: StringKeys): string | null
  function getRemoteVar(key: BooleanKeys): boolean | null
  function getRemoteVar(key: IntKeys): number | null
  function getRemoteVar(key: DoubleKeys): number | null
  function getRemoteVar(
    key: AllRemoteConfigKeys
  ): number | string | boolean | null
  function getRemoteVar(
    key: AllRemoteConfigKeys
  ): number | string | boolean | null {
    // If the client is not ready yet, return early with `null`
    if (!client || !state.id) return null

    const id = state.id

    if (isIntKey(key)) {
      return getValue(
        remoteConfigIntDefaults,
        key,
        id,
        client.getFeatureVariableInteger.bind(client)
      )
    }

    if (isStringKey(key)) {
      return getValue(
        remoteConfigStringDefaults,
        key,
        id,
        client.getFeatureVariableString.bind(client)
      )
    }

    if (isDoubleKey(key)) {
      return getValue(
        remoteConfigDoubleDefaults,
        key,
        id,
        client.getFeatureVariableDouble.bind(client)
      )
    }

    return getValue(
      remoteConfigBooleanDefaults,
      key,
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
    if (!client || !state.id) return null

    const defaultVal = flagDefaults[flag]

    const id = state.id

    try {
      const enabled = state.didInitialize
        ? client.isFeatureEnabled(flag, id.toString(), { userId: id }) ??
          defaultVal
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
    if (typeof window.addEventListener === 'undefined') {
      console.error(
        '`waitForUserRemoteConfig` not comptaible in non-browser environment.'
      )
      return
    }
    if (state.id && state.id > 0) {
      await new Promise<void>((resolve) => onClientReady(resolve))
      return
    }
    await new Promise<void>((resolve) => {
      if (state.id && state.id > 0) {
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
    userId: number,
    getFn: (
      featureKey: string,
      variableKey: string,
      userId: string,
      attributes?: { [key: string]: string | number | boolean }
    ) => T | null
  ): T {
    const defaultVal = defaults[varKey]
    if (!state.didInitialize) return defaultVal
    return (
      getFn(REMOTE_CONFIG_FEATURE_KEY, varKey, userId.toString(), {
        userId
      }) ?? defaultVal
    )
  }

  return {
    getFeatureEnabled,
    getRemoteVar,
    init,
    onClientReady,
    setUserId,
    waitForRemoteConfig,
    waitForUserRemoteConfig,
    listenForUserId,
    unlistenForUserId
  }

  // Generate negative ints for session IDs
  function generateSessionId() {
    return Math.floor(Math.random() * Number.MIN_SAFE_INTEGER)
  }
}

export type RemoteConfigInstance = ReturnType<typeof remoteConfig>
