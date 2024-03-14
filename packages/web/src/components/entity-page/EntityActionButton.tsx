import { Button, ButtonProps } from '@audius/harmony'

type CollectionActionButtonProps = ButtonProps

export const EntityActionButton = (props: CollectionActionButtonProps) => {
  const { children, ...other } = props
  return <Button {...other}>{children}</Button>
}
