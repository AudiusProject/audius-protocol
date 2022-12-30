import type { ButtonProps } from 'app/components/core'
import { Button } from 'app/components/core'

type ScreenHeaderButtonProps = ButtonProps

export const ScreenHeaderButton = (props: ScreenHeaderButtonProps) => {
  return <Button variant='secondary' size='xs' {...props} />
}
