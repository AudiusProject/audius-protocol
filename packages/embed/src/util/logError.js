/** Logs given input to console if we're not in a production environment. */

export const logError = (...args) => {
  if (
    process.env.PREACT_APP_ENVIRONMENT !== 'production' ||
    process.env.PREACT_APP_SHOW_ERROR_LOGS
  ) {
    console.error(args)
  }
  // TODO: Add Sentry logging
}
