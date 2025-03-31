import { Flex, FlexProps } from '~harmony/components'

type HeadingProps = FlexProps

export const Heading = (props: HeadingProps) => {
  return <Flex direction='column' gap='l' {...props} />
}
