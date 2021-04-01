import { Message } from '../../message'

export const ENABLE_PULL_TO_REFRESH = 'WEB/ENABLE_PULL_TO_REFRESH'
export const DISABLE_PULL_TO_REFRESH = 'WEB/DISABLE_PULL_TO_REFRESH'

type EnablePullToRefreshAction = {
  type: typeof ENABLE_PULL_TO_REFRESH
  message: Message
}

type DisablePullToRefreshAction = {
  type: typeof DISABLE_PULL_TO_REFRESH
  message: Message
}

export type WebActions = EnablePullToRefreshAction | DisablePullToRefreshAction

export const enablePullToRefresh = (
  message: Message
): EnablePullToRefreshAction => ({
  type: ENABLE_PULL_TO_REFRESH,
  message
})

export const disablePullToRefresh = (
  message: Message
): DisablePullToRefreshAction => ({
  type: DISABLE_PULL_TO_REFRESH,
  message
})
