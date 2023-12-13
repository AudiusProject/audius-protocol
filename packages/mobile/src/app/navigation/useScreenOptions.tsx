import { useCallback } from 'react'

import type { NativeStackNavigationOptions } from '@react-navigation/native-stack'

import { AudiusHomeLink } from './AudiusHomeLink'
import { BackButton } from './BackButton'

export const useScreenOptions = (
  options?: Partial<NativeStackNavigationOptions>
) => {
  return useCallback((): NativeStackNavigationOptions => {
    return {
      animation: 'default',
      fullScreenGestureEnabled: true,
      headerShadowVisible: false,
      headerTitleAlign: 'center',
      headerBackVisible: false,
      headerLeft: (props) => {
        const { canGoBack } = props
        if (canGoBack) return <BackButton />
        return null
      },
      title: '',
      headerTitle: () => <AudiusHomeLink />,
      ...options
    }
  }, [options])
}
