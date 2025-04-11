import { IconButton } from '~harmony/components/button'
import { Flex } from '~harmony/components/layout'
import { Text } from '~harmony/components/text'
import { IconArrowRight } from '~harmony/icons'

import { BaseHoverCardHeaderProps } from './types'

/**
 * A shared base component for hover card headers
 */
export const BaseHoverCardHeader = ({
  icon,
  title,
  onClose
}: BaseHoverCardHeaderProps) => {
  return (
    <Flex
      w='100%'
      alignSelf='stretch'
      backgroundColor='surface1'
      borderBottom='default'
      p='xs'
      pl='xs'
      pr='s'
      alignItems='center'
      justifyContent='space-between'
    >
      <Flex alignSelf='stretch' alignItems='center' gap='xs'>
        {icon}
        <Text
          variant='label'
          size='s'
          color='subdued'
          textTransform='uppercase'
        >
          {title}
        </Text>
      </Flex>

      <IconButton
        icon={IconArrowRight}
        color='subdued'
        size='s'
        aria-label='Close'
        onClick={onClose}
      />
    </Flex>
  )
}
