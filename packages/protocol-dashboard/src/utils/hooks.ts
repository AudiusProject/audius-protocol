import { useState, useCallback, useMemo } from 'react'
import { isMobile } from './mobile'

export const useModalControls = () => {
  const [isOpen, setIsOpen] = useState(false)
  const onClick = useCallback(() => setIsOpen(true), [setIsOpen])
  const onClose = useCallback(() => setIsOpen(false), [setIsOpen])
  return { isOpen, onClick, onClose }
}

export const useIsMobile = () =>
  useMemo(() => {
    return isMobile()
  }, [])
