import { Box, Flex, FlexProps } from '@audius/harmony'

import { MAX_PAGE_WIDTH_PX, PAGE_GUTTER_PX } from 'common/utils/layout'

export const FlushPageContainer = (props: FlexProps) => {
  const { children, ...flexProps } = props
  return (
    <Flex w='100%' justifyContent='center' {...flexProps}>
      <Box flex={`0 0 ${PAGE_GUTTER_PX}px`} />
      <Flex flex='1 1 100%' css={{ maxWidth: MAX_PAGE_WIDTH_PX }}>
        {children}
      </Flex>
      <Box flex={`0 0 ${PAGE_GUTTER_PX}px`} />
    </Flex>
  )
}
