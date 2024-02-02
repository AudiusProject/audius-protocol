import { createProxySelectorHook } from '@audius/common/hooks'

import type { AppState } from 'app/store'
export const useProxySelector = createProxySelectorHook<AppState>()
