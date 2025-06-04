import { Flex, FlexProps } from '@audius/harmony'

import {
  MAX_PAGE_WIDTH_PX,
  MIN_PAGE_WIDTH_PX,
  PAGE_GUTTER_PX
} from 'common/utils/layout'

export const FlushPageContainer = (props: FlexProps) => {
  const { children, ...flexProps } = props
  return (
    <Flex
      w='100%'
      flex='1 1 0'
      ph={PAGE_GUTTER_PX}
      justifyContent='center'
      {...flexProps}
    >
      <Flex
        flex='1'
        w='100%'
        justifyContent='center'
        css={{
          maxWidth: MAX_PAGE_WIDTH_PX,
          minWidth: MIN_PAGE_WIDTH_PX
        }}
      >
        {children}
      </Flex>
    </Flex>
  )
}
