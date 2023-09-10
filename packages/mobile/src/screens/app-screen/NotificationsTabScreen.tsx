import { NotificationsScreen } from '../notifications-screen'

import type { AppTabScreenParamList } from './AppTabScreen'
import { createAppTabScreenStack } from './createAppTabScreenStack'

export type NotificationsTabScreenParamList = AppTabScreenParamList & {
  Notifications: undefined
}

export const NotificationsTabScreen =
  createAppTabScreenStack<NotificationsTabScreenParamList>((Stack) => (
    <Stack.Screen name='Notifications' component={NotificationsScreen} />
  ))
