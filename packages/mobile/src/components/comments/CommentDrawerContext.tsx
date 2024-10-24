import type { PropsWithChildren } from 'react'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react'

import type { BottomSheetModal } from '@gorhom/bottom-sheet'

import type { CommentDrawerData } from './CommentDrawer'
import { CommentDrawer } from './CommentDrawer'

interface CommentDrawerContextState {
  isOpen: boolean
  open: (data: CommentDrawerData) => void
  close: () => void
}

const CommentDrawerContext = createContext<
  CommentDrawerContextState | undefined
>(undefined)

/**
 * Provider resposible for managing the state of the comment drawer
 */
export const CommentDrawerProvider = (props: PropsWithChildren) => {
  const { children } = props
  const [isOpen, setIsOpen] = useState(false)
  const [drawerData, setDrawerData] = useState<CommentDrawerData>()
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)

  const open = useCallback((props: CommentDrawerData) => {
    setDrawerData(props)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      bottomSheetModalRef.current?.present()
    } else {
      bottomSheetModalRef.current?.dismiss()
    }
  }, [isOpen])

  return (
    <CommentDrawerContext.Provider value={{ isOpen, open, close }}>
      {children}
      {drawerData ? (
        <CommentDrawer
          {...drawerData}
          bottomSheetModalRef={bottomSheetModalRef}
          handleClose={close}
        />
      ) : null}
    </CommentDrawerContext.Provider>
  )
}

export const useCommentDrawer = () => {
  const context = useContext(CommentDrawerContext)
  if (context === undefined) {
    throw new Error(
      'useCommentDrawer must be used within a CommentDrawerProvider'
    )
  }
  return context
}
