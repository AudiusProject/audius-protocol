import type { SetOptional } from 'type-fest'

import Drawer from '../drawer'
import type { DrawerProps } from '../drawer/Drawer'

import type { BaseConfirmationDrawerProps } from './ConfirmationDrawer'
import { ConfirmationDrawerContent } from './ConfirmationDrawer'

type ConfirmationDrawerWithoutReduxProps = BaseConfirmationDrawerProps &
  SetOptional<DrawerProps, 'children'>

/** ConfirmationDrawer that isn't coupled to redux */
export const ConfirmationDrawerWithoutRedux = (
  props: ConfirmationDrawerWithoutReduxProps
) => {
  const {
    messages,
    onConfirm,
    onCancel,
    variant,
    icon,
    addBottomInset,
    ...other
  } = props
  const { onClose } = other

  return (
    <Drawer {...props}>
      <ConfirmationDrawerContent
        onClose={onClose}
        messages={messages}
        onConfirm={onConfirm}
        onCancel={onCancel}
        variant={variant}
        icon={icon}
        addBottomInset={addBottomInset}
      />
    </Drawer>
  )
}
