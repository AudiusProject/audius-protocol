import type { ButtonProps } from 'app/components/core'
import { Button } from 'app/components/core'

type ScreenHeaderButtonProps = ButtonProps & {
  title: string
}

export const ScreenHeaderButton = (props: ScreenHeaderButtonProps) => {
  return <Button key={props.title} variant='secondary' size='xs' {...props} />
}
