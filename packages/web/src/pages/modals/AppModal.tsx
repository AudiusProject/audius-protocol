import { ComponentType } from 'react'

import { Modals } from 'common/store/ui/modals/slice'

import { useModalState } from './useModalState'

type AppModalProps = {
  modal: ComponentType
  name: Modals
}

export const AppModal = (props: AppModalProps) => {
  const { name, modal: Modal } = props
  const { modalState } = useModalState(name)

  if (modalState === false) return null

  return <Modal />
}
