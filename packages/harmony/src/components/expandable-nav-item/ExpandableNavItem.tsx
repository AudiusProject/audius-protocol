import { useMemo, useState } from 'react'

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
  label,
  leftIcon: LeftIcon,
  rightIcon,
  defaultIsOpen = false,
  nestedItems,
  shouldPersistRightIcon = false,
  ...props
}: ExpandableNavItemProps) => {
  const [isOpen, setIsOpen] = useState(defaultIsOpen)
  const [isHovered, setIsHovered] = useState(false)
  const theme = useTheme()

  const handleMouseEnter = () => setIsHovered(true)
  const handleMouseLeave = () => setIsHovered(false)
  const handleClick = () => setIsOpen(!isOpen)

  const styles = useMemo(
    () => getStyles(theme, isOpen, isHovered),
    [theme, isOpen, isHovered]
  )

  const IconComponent = isHovered
    ? isOpen
      ? IconCaretDown
      : IconCaretRight
    : LeftIcon

  const shouldShowRightIcon = isOpen || shouldPersistRightIcon

  const stopRightIconPropagation = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <Flex direction='column' role='navigation' {...props}>
      <Flex
        alignItems='center'
        gap='s'
        pl='s'
        pr='s'
        css={{
          width: '240px',
          cursor: 'pointer',
          transition: `background-color ${theme.motion.hover}`
        }}
      >
        <Flex
          alignItems='center'
          flex={1}
          gap='m'
          p='s'
          borderRadius='m'
          css={styles}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          role='button'
          aria-expanded={isOpen}
          aria-controls={`${label}-content`}
          aria-label={`${label} navigation section`}
        >
          <Flex
            alignItems='center'
            gap='m'
            flex={1}
            css={{
              maxWidth: '240px'
            }}
          >
            {IconComponent ? <IconComponent color='default' size='m' /> : null}
            <Text
              variant='title'
              size='l'
              strength='weak'
              lineHeight='single'
              color='default'
              ellipses
              maxLines={1}
            >
              {label}
            </Text>
          </Flex>
          {shouldShowRightIcon ? (
            <div onClick={stopRightIconPropagation}>{rightIcon}</div>
          ) : null}
        </Flex>
      </Flex>
      {isOpen && nestedItems ? (
        <Flex
          direction='column'
          id={`${label}-content`}
          role='region'
          aria-label={`${label} content`}
        >
          {nestedItems}
        </Flex>
      ) : null}
    </Flex>
  )
}
