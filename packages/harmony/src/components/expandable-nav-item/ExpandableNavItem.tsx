import { useMemo, useState } from 'react'

import { useTheme, CSSObject } from '@emotion/react'

import { HarmonyTheme } from '../../foundations/theme'
import { IconCaretDown, IconCaretRight } from '../../icons'
import { Box } from '../layout/Box'
import { Flex } from '../layout/Flex'
import { Text } from '../text'

import type { ExpandableNavItemProps, VariantConfigs } from './types'

const variants: VariantConfigs = {
  default: {
    textVariant: 'title',
    textSize: 'l',
    textStrength: 'weak',
    iconSize: 'l',
    gap: 'm'
  },
  compact: {
    textVariant: 'body',
    textSize: 's',
    textStrength: undefined,
    iconSize: 's',
    gap: 'xs'
  }
}

const getStyles = (theme: HarmonyTheme, isHovered: boolean): CSSObject => {
  const baseStyles: CSSObject = {
    transition: `background-color ${theme.motion.hover}`,
    cursor: 'pointer'
  }

  const hoverStyles: CSSObject = {
    backgroundColor: theme.color.background.surface2,
    boxShadow: `inset 0 0 0 1px ${theme.color.border.default}`
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
  variant = 'default',
  onClick,
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
    onClick?.()
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
      return <LeftIcon size={variants[variant].iconSize} color='default' />
    }

    return null
  }, [isHovered, canUnfurl, LeftIcon, isOpen, variant])

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
            gap={variants[variant].gap}
            flex={1}
            css={{
              maxWidth: '240px'
            }}
          >
            {leftIcon}
            <Text
              variant={variants[variant].textVariant}
              size={variants[variant].textSize}
              strength={variants[variant].textStrength}
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
