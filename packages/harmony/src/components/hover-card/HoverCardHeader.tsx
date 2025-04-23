import { Flex, Text, IconButton } from '~harmony/index'

import { HoverCardHeaderProps } from './types'

/**
 * A shared base component for hover card headers
 */
export const HoverCardHeader = ({
  iconLeft,
  title,
  onClose,
  iconRight
}: HoverCardHeaderProps) => {
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
        {iconLeft ? (
          <IconButton
            icon={iconLeft}
            color='subdued'
            size='l'
            aria-label={''}
            onClick={onClose}
          />
        ) : null}
        <Text
          variant='label'
          size='s'
          color='default'
          textTransform='uppercase'
        >
          {title}
        </Text>
      </Flex>
      {iconRight ? (
        <IconButton
          icon={iconRight}
          color='subdued'
          size='s'
          aria-label='Close'
          onClick={onClose}
        />
      ) : null}
    </Flex>
  )
}
