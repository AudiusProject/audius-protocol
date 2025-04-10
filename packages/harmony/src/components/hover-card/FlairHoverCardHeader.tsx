import { ReactNode } from 'react'

import { IconButton } from '~harmony/components/button'
import { Flex } from '~harmony/components/layout'
import { Text } from '~harmony/components/text'
import { IconArrowRight } from '~harmony/icons'

export type BaseFlairHoverCardHeaderProps = {
  /**
   * The icon or component to display on the left side of the header
   */
  icon: ReactNode
  /**
   * The title to display in the header
   */
  title: string
  /**
   * Optional callback when the close button is clicked
   */
  onClose?: () => void
}

/**
 * A shared base component for flair hover card headers
 */
export const BaseFlairHoverCardHeader = ({
  icon,
  title,
  onClose
}: BaseFlairHoverCardHeaderProps) => {
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
