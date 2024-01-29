import { Flex, FlexProps } from 'components'

type HeadingProps = FlexProps

export const Heading = (props: HeadingProps) => {
  return <Flex direction='column' gap='l' {...props} />
}
