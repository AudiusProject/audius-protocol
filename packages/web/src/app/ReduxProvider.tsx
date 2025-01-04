import { ReactNode } from 'react'

import { Provider } from 'react-redux'
import { PartialDeep } from 'type-fest'

import { useHistoryContext } from 'app/HistoryProvider'
import { useIsMobile } from 'hooks/useIsMobile'
import { configureStore } from 'store/configureStore'
import { AppState } from 'store/types'

type ReduxProviderProps = {
  children: ReactNode
  initialStoreState?: PartialDeep<AppState>
}

export const ReduxProvider = ({
  children,
  initialStoreState
}: ReduxProviderProps) => {
  const { history } = useHistoryContext()
  const isMobile = useIsMobile()
  const { store } = configureStore(history, isMobile, initialStoreState)

  return <Provider store={store}>{children}</Provider>
}
