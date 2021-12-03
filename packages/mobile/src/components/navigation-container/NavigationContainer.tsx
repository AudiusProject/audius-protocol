import React, { ReactNode } from 'react'

import {
  LinkingOptions,
  NavigationContainer as RNNavigationContainer
} from '@react-navigation/native'

import { AppStackParamList } from 'app/components/app-navigator/types'

type Props = {
  children: ReactNode
}

const linking: LinkingOptions<AppStackParamList> = {
  prefixes: ['https://audius.co'],
  // configuration for matching screens with paths
  config: {
    screens: {
      main: {
        initialRouteName: 'feed',
        screens: {
          feed: {
            screens: {
              feed: 'feed',
              track: '*/*'
            }
          },
          trending: 'trending',
          explore: 'explore',
          favorites: 'favorites',
          profile: '*'
        }
      }
    }
  }
}

/**
 * NavigationContainer contains the react-navigation context
 * and configures linking
 */
const NavigationContainer = ({ children }: Props) => {
  return (
    <RNNavigationContainer linking={linking}>{children}</RNNavigationContainer>
  )
}

export default NavigationContainer
