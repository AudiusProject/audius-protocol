import { forwardRef, useContext, useMemo } from 'react'

import type { BaseTextProps } from '@audius/harmony/src/components/text'
import {
  variantStylesMap,
  bodyLineHeightMap
} from '@audius/harmony/src/components/text/constants'
import { TextContext } from '@audius/harmony/src/components/text/textContext'
import { css } from '@emotion/native'
import type { TextProps as NativeTextProps, TextStyle } from 'react-native'
import { Platform, Text as TextBase } from 'react-native'

import { useTheme } from '../../foundations/theme'

// Unicode subscript characters
const SUBSCRIPT_CHARS =
  /[\u2080-\u2089\u208A-\u208E\u2090-\u209C\u209D-\u209F]/g

// Function to detect subscript characters and calculate adjustments
const getSubscriptAdjustments = (text: string, fontSize: number) => {
  const subscriptMatches = text.match(SUBSCRIPT_CHARS)
  const hasSubscripts = Boolean(subscriptMatches?.length)

  if (!hasSubscripts) {
    return { hasSubscripts: false, lineHeightIncrease: 0, translateY: 0 }
  }

  // Calculate adjustments based on font size
  // Subscript characters are typically 60-70% of normal character height
  const subscriptRatio = 0.65
  const subscriptHeight = fontSize * subscriptRatio

  // Increase line height to accommodate subscript characters
  // Add extra space equal to the difference between normal and subscript height
  const lineHeightIncrease = fontSize - subscriptHeight

  // Shift text down slightly to better align with subscript characters
  // This helps maintain visual balance
  const translateY = lineHeightIncrease * 0.3

  return {
    hasSubscripts: true,
    lineHeightIncrease,
    translateY
  }
}

export type TextProps = NativeTextProps &
  Omit<BaseTextProps, 'textAlign' | 'ellipsis'> & {
    textAlign?: TextStyle['textAlign']
    textTransform?: TextStyle['textTransform']
    // Needed for proper text wrapping
    flexShrink?: number
    userSelect?: 'none' | 'text' | 'all' | 'contain'
  }

export const Text = forwardRef<TextBase, TextProps>((props, ref) => {
  const {
    variant: variantProp,
    size: sizeProp,
    strength: strengthProp,
    style: styleProp,
    color: colorProp = 'default',
    textAlign,
    textTransform,
    shadow,
    flexShrink,
    lineHeight,
    userSelect,
    children,
    ...other
  } = props
  const theme = useTheme()
  const { variant: contextVariant } = useContext(TextContext)
  const variant = variantProp ?? contextVariant ?? 'body'
  const parentVariant = contextVariant && !variantProp
  const strength = strengthProp ?? (parentVariant ? undefined : 'default')
  const size = sizeProp ?? (parentVariant ? undefined : 'm')
  // TODO: make heading a proper gradient
  const color =
    colorProp === 'heading'
      ? theme.color.secondary.secondary
      : theme.color.text[colorProp]

  const variantStyles = variant && variantStylesMap[variant]
  const t = theme.typography

  const fontWeight = strength && variantStyles?.fontWeight[strength]

  // Get font size for subscript calculations
  const fontSize =
    size && variantStyles ? t.size[variantStyles.fontSize[size]] : 16

  // Detect subscript characters and calculate adjustments
  const subscriptAdjustments = useMemo(() => {
    // Extract text content from children for subscript detection
    const extractText = (children: React.ReactNode): string => {
      if (typeof children === 'string') return children
      if (typeof children === 'number') return children.toString()
      if (Array.isArray(children)) {
        return children.map(extractText).join('')
      }
      if (children && typeof children === 'object' && 'props' in children) {
        return extractText(children.props.children)
      }
      return ''
    }

    const textContent = extractText(children)
    return getSubscriptAdjustments(textContent, fontSize)
  }, [children, fontSize])

  const textStyles: TextStyle = css({
    ...(variantStyles && {
      fontSize: size && t.size[variantStyles.fontSize[size]],
      lineHeight:
        size &&
        t.lineHeight[
          lineHeight && variant === 'body'
            ? bodyLineHeightMap[size][lineHeight]
            : variantStyles.lineHeight[size]
        ],
      fontFamily:
        strength && t.fontByWeight[variantStyles.fontWeight[strength]],
      ...('css' in variantStyles ? (variantStyles.css ?? {}) : {})
    }),
    ...(color && { color }),
    ...(shadow && t.shadow[shadow]),
    textAlign,
    ...(textTransform && { textTransform }),
    // Fixes demiBold text misalignment on iOS
    ...(fontWeight === 'demiBold' && Platform.OS === 'ios'
      ? { marginTop: 2 }
      : {}),
    flexShrink,
    ...(userSelect && { userSelect }),
    // Apply subscript adjustments
    ...(subscriptAdjustments.hasSubscripts && {
      lineHeight:
        size && variantStyles
          ? parseInt(
              t.lineHeight[
                lineHeight && variant === 'body'
                  ? bodyLineHeightMap[size][lineHeight]
                  : variantStyles.lineHeight[size]
              ].replace('px', '')
            ) + subscriptAdjustments.lineHeightIncrease
          : undefined,
      transform: [{ translateY: subscriptAdjustments.translateY }]
    })
  })

  const isHeading = variant === 'display' || variant === 'heading'

  const textElement = (
    <TextBase
      ref={ref}
      style={[textStyles, styleProp]}
      role={isHeading ? 'heading' : undefined}
      {...other}
    />
  )

  if (parentVariant) {
    return textElement
  }

  return (
    <TextContext.Provider value={{ variant }}>
      {textElement}
    </TextContext.Provider>
  )
})

export { variantStylesMap, bodyLineHeightMap }
export type { TextSize } from '@audius/harmony/src/components/text/types'
