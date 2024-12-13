import { useEffectOnce } from 'react-use'

import { screen } from 'app/services/analytics'

import type { SignOnScreenParamList } from '../types'

export const useTrackScreen = (
  route: keyof SignOnScreenParamList | 'CreateEmail' | 'SignIn',
  properties?: any
) => {
  useEffectOnce(() => {
    screen({ route, properties })
  })
}
