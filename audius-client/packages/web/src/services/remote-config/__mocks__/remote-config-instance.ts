import { RemoteConfigInstance } from '@audius/common'

let fakeConfig: Record<string, any> = {}

const __setConfig = (config: Record<string, any>) => {
  fakeConfig = config
}

export type MockRemoteConfigInstance = RemoteConfigInstance & {
  __setConfig: (config: Record<string, any>) => void
}

export const remoteConfigInstance = {
  init: jest.fn(),
  getRemoteVar: (key: any) => {
    return fakeConfig[key] ?? null
  },
  __setConfig
}
