import type { ReactNode } from 'react'

import { Toasts } from '../toasts'

type ModalScreenProps = {
  children: ReactNode
}

export const ModalScreen = (props: ModalScreenProps) => {
  const { children } = props
  return (
    <>
      <Toasts />
      {children}
    </>
  )
}
