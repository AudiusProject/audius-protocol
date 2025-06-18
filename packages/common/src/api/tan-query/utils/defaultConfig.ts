import { Query, QueryKey } from '@tanstack/react-query'

import {
  ErrorLevel,
  Feature,
  ReportToSentryArgs
} from '~/models/ErrorReporting'

export const MAX_RETRIES = 3
export const HTTP_STATUSES_TO_NOT_RETRY = [400, 401, 403, 404]

export const defaultRetryConfig = (failureCount: number, error: any) => {
  if (failureCount > MAX_RETRIES) {
    return false
  }

  if (
    error?.response?.status &&
    HTTP_STATUSES_TO_NOT_RETRY.includes(error?.response?.status)
  ) {
    return false
  }

  return true
}

type ReportToSentry = (args: ReportToSentryArgs) => Promise<void>

export const queryErrorHandler = (
  err: unknown,
  query: Query<unknown, unknown, unknown, QueryKey>,
  reportToSentry: ReportToSentry
) => {
  const error = err instanceof Error ? err : new Error(String(err))
  reportToSentry({
    error,
    level: ErrorLevel.Error,
    feature: Feature.TanQuery,
    name: `Query Error: ${query.queryKey[0] as string}`,
    additionalInfo: {
      queryHookMetadata: {
        queryKey: query.queryKey,
        isActive: query.isActive,
        isStale: query.isStale,
        isDisabled: query.isDisabled
      }
    }
  })
}
