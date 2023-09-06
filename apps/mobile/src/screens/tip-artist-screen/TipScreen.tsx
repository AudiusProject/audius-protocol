import type { ScreenProps } from 'app/components/core'
import { ScreenContent, Screen } from 'app/components/core'

type TipScreenProps = ScreenProps

export const TipScreen = ({ children, ...props }: TipScreenProps) => {
  return (
    <Screen
      variant='white'
      style={{ paddingVertical: 60, paddingHorizontal: 16 }}
      {...props}
    >
      <ScreenContent>{children}</ScreenContent>
    </Screen>
  )
}
