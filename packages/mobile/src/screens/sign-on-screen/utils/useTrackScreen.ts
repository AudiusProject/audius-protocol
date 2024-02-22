import { useEffectOnce } from 'react-use'

import { screen } from 'app/services/analytics'

import type { SignUpScreenParamList } from '../types'

export const useTrackScreen = (
  route: keyof SignUpScreenParamList | 'CreateEmail' | 'SignIn',
  properties?: any
) => {
  useEffectOnce(() => {
    screen({ route, properties })
  })
}
