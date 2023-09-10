import { createProxySelectorHook } from '@audius/common'

import type { AppState } from 'app/store'
export const useProxySelector = createProxySelectorHook<AppState>()
