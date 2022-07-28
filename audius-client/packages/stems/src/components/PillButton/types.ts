import { ButtonProps } from 'components/Button'

export enum Variant {
  PRIMARY = 'primary',
  SECONDARY = 'secondary'
}

export type PillButtonProps = ButtonProps & {
  variant: Variant
}
