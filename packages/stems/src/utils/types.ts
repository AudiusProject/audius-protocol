import { ComponentPropsWithoutRef } from 'react'

export type BaseButtonProps = Omit<
  ComponentPropsWithoutRef<'button'>,
  'children'
>
