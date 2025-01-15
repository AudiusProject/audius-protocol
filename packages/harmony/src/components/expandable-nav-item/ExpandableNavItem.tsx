import { useMemo, useState } from 'react'

import { useTheme, CSSObject } from '@emotion/react'
import { ResizeObserver } from '@juggle/resize-observer'
import useMeasure from 'react-use-measure'

import { HarmonyTheme } from '../../foundations/theme'
import { IconCaretRight } from '../../icons'
import { Box } from '../layout/Box'
import { Flex } from '../layout/Flex'
import { Text } from '../text'

import type { ExpandableNavItemProps, VariantConfigs } from './types'

const ITEM_DEFAULT_WIDTH = '240px'

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

const getStyles = (
  theme: HarmonyTheme,
  isHovered: boolean,
  disabled?: boolean
): CSSObject => {
  const baseStyles: CSSObject = {
    transition: `background-color ${theme.motion.hover}`,
    opacity: disabled ? 0.5 : 1
  }

  const hoverStyles: CSSObject = {
    backgroundColor: theme.color.background.surface2,
    boxShadow: `inset 0 0 0 1px ${theme.color.border.default}`
  }

  return {
    ...baseStyles,
    ...(!disabled && isHovered && hoverStyles),
    '&:active': {
      opacity: disabled ? 0.4 : 0.8,
      transition: `opacity ${theme.motion.quick}`
    }
  }
}

export const ExpandableNavItem = ({
  label,
  leftIcon: LeftIcon,
  rightIcon,
  defaultIsOpen = false,
  nestedItems,
  shouldPersistRightIcon = false,
  shouldPersistDownArrow = false,
  canUnfurl = true,
  variant = 'default',
  onClick,
  disabled,
  ...props
}: ExpandableNavItemProps) => {
  const [isOpen, setIsOpen] = useState(defaultIsOpen)
  const [isHovered, setIsHovered] = useState(false)
  const theme = useTheme()

  const [ref, bounds] = useMeasure({
    polyfill: ResizeObserver
  })

  const handleMouseEnter = () => setIsHovered(true)
  const handleMouseLeave = () => setIsHovered(false)
  const handleClick = () => {
    if (canUnfurl) {
      setIsOpen(!isOpen)
    }
    onClick?.(!isOpen)
  }

  const styles = useMemo(
    () => getStyles(theme, isHovered, disabled),
    [theme, isHovered, disabled]
  )

  const getIcon = useMemo(() => {
    const isCaretVisibleWhenHovered = isHovered && canUnfurl
    const isDownArrowPersistent = shouldPersistDownArrow && isOpen
    const shouldShowCaret = isCaretVisibleWhenHovered || isDownArrowPersistent
    return (
      <>
        {LeftIcon ? (
          <LeftIcon
            size={variants[variant].iconSize}
            color='default'
            css={{
              transition: `opacity ${theme.motion.quick}`,
              opacity: shouldShowCaret ? 0 : 1,
              position: 'absolute'
            }}
          />
        ) : null}
        <IconCaretRight
          size='s'
          color='default'
          css={{
            transition: `transform ${theme.motion.expressive}, opacity ${theme.motion.quick}`,
            transform: isOpen ? `rotate(90deg)` : undefined,
            opacity: shouldShowCaret ? 1 : 0
          }}
        />
      </>
    )
  }, [
    isHovered,
    canUnfurl,
    shouldPersistDownArrow,
    LeftIcon,
    variant,
    theme.motion.quick,
    theme.motion.expressive,
    isOpen
  ])

  const leftIcon = useMemo(() => {
    if (!getIcon && !LeftIcon) return null

    const dimensions = variant === 'compact' ? 'unit5' : 'unit6'

    return (
      <Flex
        alignItems='center'
        justifyContent='center'
        h={dimensions}
        w={dimensions}
      >
        {getIcon}
      </Flex>
    )
  }, [getIcon, LeftIcon, variant])

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
          width: ITEM_DEFAULT_WIDTH,
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
              maxWidth: ITEM_DEFAULT_WIDTH,
              transition: `opacity ${theme.motion.expressive}`
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
      {nestedItems ? (
        <Flex
          direction='column'
          css={{
            transition: `height ${theme.motion.expressive}, opacity ${theme.motion.quick}`,
            overflow: 'hidden',
            opacity: isOpen ? 1 : 0
          }}
          style={{ height: isOpen ? bounds.height : 0 }}
        >
          <Flex
            direction='column'
            ref={ref}
            id={`${label}-content`}
            role='region'
            aria-label={`${label} content`}
          >
            {nestedItems}
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  )
}
