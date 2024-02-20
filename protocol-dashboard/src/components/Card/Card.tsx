import { Flex, FlexProps } from '@audius/harmony'

export const Card = (props: FlexProps) => {
  return (
    <Flex
      backgroundColor="white"
      borderRadius="l"
      border="default"
      {...props}
    />
  )
}
