import { createContext, useContext } from 'react'

import type { ID } from '@audius/common/models'

import type { useNavigation } from 'app/hooks/useNavigation'
export type RecentUserCommentsDrawerContextType = {
  onClose: () => void
  userId: ID
  navigation: ReturnType<typeof useNavigation>
}

export const RecentUserCommentsDrawerContext = createContext<
  RecentUserCommentsDrawerContextType | undefined
>(undefined)

export const RecentUserCommentsDrawerProvider = ({
  children,
  ...props
}: {
  children: React.ReactNode
} & RecentUserCommentsDrawerContextType) => {
  return (
    <RecentUserCommentsDrawerContext.Provider value={props}>
      {children}
    </RecentUserCommentsDrawerContext.Provider>
  )
}

export const useRecentUserCommentsDrawer = () => {
  const context = useContext(RecentUserCommentsDrawerContext)
  if (!context) {
    throw new Error(
      'useRecentUserCommentsDrawer must be used within a RecentUserCommentsDrawerProvider'
    )
  }
  return context
}
