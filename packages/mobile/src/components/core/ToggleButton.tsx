import { useToggle } from 'react-use'

import { Button } from './Button'

export const ToggleButton = (props) => {
  const [isActive, setIsActive] = useToggle(false)

  return (
    <Button
      variant={isActive ? 'secondary' : 'commonSecondary'}
      {...props}
      onPress={setIsActive}
    />
  )
}
