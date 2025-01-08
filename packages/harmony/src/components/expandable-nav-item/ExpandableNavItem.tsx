import { useMemo, useState } from 'react'

import { useTheme, CSSObject } from '@emotion/react'

import { HarmonyTheme } from '../../foundations/theme'
import { IconCaretDown, IconCaretRight } from '../../icons'
import { Box } from '../layout/Box'
import { Flex } from '../layout/Flex'
import { Text } from '../text'

import type { ExpandableNavItemProps } from './types'

const getStyles = (theme: HarmonyTheme, isHovered: boolean): CSSObject => {
  const baseStyles: CSSObject = {
    transition: `background-color ${theme.motion.hover}`,
    cursor: 'pointer',
    border: `1px solid transparent`
  }

  const hoverStyles: CSSObject = {
    backgroundColor: theme.color.background.surface2,
    border: `1px solid ${theme.color.border.default}`
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
  canUnfurl = true,
  ...props
}: ExpandableNavItemProps) => {
  const [isOpen, setIsOpen] = useState(defaultIsOpen)
  const [isHovered, setIsHovered] = useState(false)
  const theme = useTheme()

  const handleMouseEnter = () => setIsHovered(true)
  const handleMouseLeave = () => setIsHovered(false)
  const handleClick = () => {
    if (canUnfurl) {
      setIsOpen(!isOpen)
    }
  }

  const styles = useMemo(() => getStyles(theme, isHovered), [theme, isHovered])

  const getIcon = useMemo(() => {
    const shouldShowCaret = isHovered && canUnfurl
    if (shouldShowCaret) {
      return isOpen ? (
        <IconCaretDown size='s' color='default' />
      ) : (
        <IconCaretRight size='s' color='default' />
      )
    }

    if (LeftIcon) {
      return <LeftIcon size='l' color='default' />
    }

    return null
  }, [isHovered, isOpen, LeftIcon, canUnfurl])

  const leftIcon = useMemo(() => {
    if (!getIcon) return null

    return (
      <Flex alignItems='center' justifyContent='center' h='unit6' w='unit6'>
        {getIcon}
      </Flex>
    )
  }, [getIcon])

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
            {leftIcon}
            <Text
              variant='title'
              size='l'
              strength='weak'
              lineHeight='single'
              color='default'
              ellipses
            >
              {label}
            </Text>
          </Flex>
          {shouldShowRightIcon ? (
            <Box onClick={stopRightIconPropagation}>{rightIcon}</Box>
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
