import optimizely from '@optimizely/optimizely-sdk'

import { ID } from 'common/models/Identifiers'
import { Nullable } from 'common/utils/typeUtils'
import { uuid } from 'common/utils/uid'

import {
  FeatureFlags,
  flagDefaults,
  flagCohortType,
  FeatureFlagCohortType,
  FEATURE_FLAG_LOCAL_STORAGE_SESSION_KEY
} from './FeatureFlags'
import {
  IntKeys,
  StringKeys,
  DoubleKeys,
  BooleanKeys,
  AllRemoteConfigKeys
} from './RemoteConfig'
import {
  remoteConfigIntDefaults,
  remoteConfigStringDefaults,
  remoteConfigDoubleDefaults,
  remoteConfigBooleanDefaults
} from './defaults'

// Constants
// All optimizely feature keys are lowercase_snake
const REMOTE_CONFIG_FEATURE_KEY = 'remote_config'

// Internal State
type State = {
  didInitialize: boolean
  onDidInitializeFunc: (() => void) | undefined
  userId: Nullable<string>
  sessionId: string
}

const state: State = {
  didInitialize: false,
  onDidInitializeFunc: undefined,
  userId: null,
  sessionId:
    window.localStorage?.getItem(FEATURE_FLAG_LOCAL_STORAGE_SESSION_KEY) ||
    uuid()
}

// Don't spam logs. Comment out this line for info logs.
optimizely.setLogLevel('warn')

// Optimizely provider, set in `init`
let provider: optimizely.Client | undefined

// API

/**
 * Register a callback for provider ready. Can
 * only register a single callback.
 * @param func
 */
export function onProviderReady(func: () => void) {
  if (state.didInitialize) {
    func()
  } else {
    state.onDidInitializeFunc = func
  }
}

/**
 * Set the userId for calls to Optimizely.
 * Prior to calling, uses the ANONYMOUS_USER_ID constant.
 * @param userId
 */
export function setUserId(userId: ID) {
  state.userId = userId.toString()
}

/**
 * Access a remotely configured value.
 * @param key
 */
export function getRemoteVar(key: BooleanKeys): boolean | null
export function getRemoteVar(key: StringKeys): string | null
export function getRemoteVar(key: IntKeys): number | null
export function getRemoteVar(key: DoubleKeys): number | null
export function getRemoteVar(
  key: AllRemoteConfigKeys
): number | string | boolean | null
export function getRemoteVar(
  key: AllRemoteConfigKeys
): number | string | boolean | null {
  // If the provider is not ready yet, return early with `null`
  if (!provider) return null

  // If userId is null, set to string default. This will effectively capture all users as intended for remote config
  const id = state.userId || 'ANONYMOUS_USER'

  if (isIntKey(key)) {
    return getValueHelper(
      remoteConfigIntDefaults,
      key,
      id,
      provider.getFeatureVariableInteger.bind(provider)
    )
  }

  // TODO: We can take out the keyof typeof garbage
  // once all the enums have keys.
  if (isStringKey(key)) {
    return getValueHelper(
      remoteConfigStringDefaults,
      (key as unknown) as string,
      id,
      provider.getFeatureVariableString.bind(provider)
    )
  }

  if (isDoubleKey(key)) {
    return getValueHelper(
      remoteConfigDoubleDefaults,
      (key as unknown) as string,
      id,
      provider.getFeatureVariableDouble.bind(provider)
    )
  }

  return getValueHelper(
    remoteConfigBooleanDefaults,
    (key as unknown) as string,
    id,
    provider.getFeatureVariableBoolean.bind(provider)
  )
}

/**
 * Gets whether a given feature flag is enabled.
 * @param flag
 */
export function getFeatureEnabled(flag: FeatureFlags) {
  // If the provider is not ready yet, return early with `null`
  if (!provider) return null

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
      id = state.sessionId
      break
    }
  }

  try {
    const enabled = state.didInitialize
      ? provider.isFeatureEnabled((flag as unknown) as string, id) ?? defaultVal
      : defaultVal
    return enabled
  } catch (err) {
    return defaultVal
  }
}

export const waitForRemoteConfig = async () => {
  if (state.didInitialize) return true
  let cb
  await new Promise(resolve => {
    cb = resolve
    window.addEventListener('REMOTE_CONFIG_LOADED', cb)
  })
  if (cb) window.removeEventListener('REMOTE_CONFIG_LOADED', cb)
}

export const waitForRemoteConfigDataFile = async () => {
  // Wait for optimizely to load if necessary (as it can be an async or defer tag)
  // @ts-ignore: injected in index.html
  if (!window.optimizelyDatafile) {
    let cb
    await new Promise(resolve => {
      cb = resolve
      window.addEventListener('OPTIMIZELY_LOADED', cb)
    })
    if (cb) window.removeEventListener('OPTIMIZELY_LOADED', cb)
  }
}

// Internal

const init = async () => {
  console.time('remote-config')
  await waitForRemoteConfigDataFile()

  // Set sessionId for feature flag bucketing
  if (!window.localStorage.getItem(FEATURE_FLAG_LOCAL_STORAGE_SESSION_KEY)) {
    window.localStorage.setItem(
      FEATURE_FLAG_LOCAL_STORAGE_SESSION_KEY,
      state.sessionId
    )
  }

  provider = optimizely.createInstance({
    // @ts-ignore: injected in index.html
    datafile: window.optimizelyDatafile
  })

  provider.onReady().then(() => {
    state.didInitialize = true
    // If we've set an onInitialize callback, call it back.
    if (state.onDidInitializeFunc) {
      state.onDidInitializeFunc()
      state.onDidInitializeFunc = undefined
    }
    console.timeEnd('remote-config')
    window.dispatchEvent(new CustomEvent('REMOTE_CONFIG_LOADED'))
  })
}

init()

// Type predicates
function isIntKey(key: AllRemoteConfigKeys): key is IntKeys {
  return !!Object.values(IntKeys).find(x => x === key)
}
function isStringKey(key: AllRemoteConfigKeys): key is StringKeys {
  return !!Object.values(StringKeys).find(x => x === key)
}
function isDoubleKey(key: AllRemoteConfigKeys): key is DoubleKeys {
  return !!Object.values(DoubleKeys).find(x => x === key)
}

// Removes some boilerplate around getting values, falling back to defaults,
// calling the correct provider fn.
function getValueHelper<T>(
  defaults: { [id: string]: T },
  varKey: string,
  userId: string,
  getFn: (featureKey: string, variableKey: string, userId: string) => T | null
): T {
  const defaultVal = defaults[varKey]
  if (!state.didInitialize) return defaultVal
  return getFn(REMOTE_CONFIG_FEATURE_KEY, varKey, userId) ?? defaultVal
}
