import mergeWith from 'lodash/mergeWith'

/**
 * Gets the config with any undefined properties replaced by the defaults
 * @param config the config
 * @param defaults the defaults
 * @returns the merged config with defaults
 */
export const mergeConfigWithDefaults = <T, K>(config: T, defaults: K) =>
  mergeWith({}, defaults, config, (_a, b) => {
    if (Array.isArray(b)) {
      return b
    }
    return undefined
  })
