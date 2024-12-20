import { useState } from 'react'

import { useTheme, CSSObject } from '@emotion/react'

import { HarmonyTheme } from '../../foundations/theme'
import { IconCaretDown, IconCaretRight } from '../../icons'
import { Flex } from '../layout/Flex'
import { Text } from '../text'

import type { ExpandableNavItemProps } from './types'

const getStyles = (
  theme: HarmonyTheme,
  isOpen: boolean,
  isHovered: boolean
): CSSObject => {
  const baseStyles: CSSObject = {
    transition: `background-color ${theme.motion.hover}`,
    cursor: 'pointer',
    border: `1px solid ${isOpen ? theme.color.border.default : 'transparent'}`
  }

  const hoverStyles: CSSObject = {
    backgroundColor: theme.color.background.surface2
  }

  return {
    ...baseStyles,
    ...(isHovered && hoverStyles)
  }
}

export const ExpandableNavItem = ({
  children,
  leftIcon: LeftIcon,
  rightIcon,
  defaultIsOpen = false,
  nestedItems,
  ...props
}: ExpandableNavItemProps) => {
  const [isOpen, setIsOpen] = useState(defaultIsOpen)
  const [isHovered, setIsHovered] = useState(false)
  const theme = useTheme()

  const handleMouseEnter = () => setIsHovered(true)
  const handleMouseLeave = () => setIsHovered(false)
  const handleClick = () => setIsOpen(!isOpen)

  const IconComponent = isHovered
    ? isOpen
      ? IconCaretDown
      : IconCaretRight
    : LeftIcon

  return (
    <Flex direction='column' {...props}>
      <Flex
        w={240}
        borderRadius='m'
        p='s'
        ph='l'
        css={getStyles(theme, isOpen, isHovered)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        alignItems='center'
        gap='s'
        justifyContent='flex-start'
        flex={1}
      >
        {IconComponent ? (
          <Flex alignSelf='stretch' mt='auto' mb='auto' w={16}>
            <IconComponent color='subdued' />
          </Flex>
        ) : null}
        <Flex
          w={240}
          mt='auto'
          mb='auto'
          alignItems='center'
          gap='s'
          justifyContent='flex-start'
          flex={1}
        >
          <Text variant='body' size='m' color='default' ellipses maxLines={1}>
            {children}
          </Text>
        </Flex>
        {isOpen ? rightIcon : null}
      </Flex>
      {isOpen && nestedItems ? (
        <Flex direction='column' pl='2xl'>
          {nestedItems}
        </Flex>
      ) : null}
    </Flex>
  )
}
