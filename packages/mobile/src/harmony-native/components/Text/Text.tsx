import { forwardRef } from 'react'

import type { BaseTextProps } from '@audius/harmony'
import { variantStylesMap } from '@audius/harmony'
import { css } from '@emotion/native'
import type { TextProps as NativeTextProps, TextStyle } from 'react-native'
import { Text as TextBase } from 'react-native'

import { useTheme } from '../../foundations/theme'

export type TextProps = NativeTextProps &
  Omit<BaseTextProps, 'textAlign'> & {
    textAlign?: TextStyle['textAlign']
  }

export const Text = forwardRef<TextBase, TextProps>((props, ref) => {
  const {
    variant = 'body',
    size = 'm',
    strength = 'default',
    style: styleProp,
    color: colorProp = 'default',
    textAlign,
    shadow,
    ...other
  } = props
  const theme = useTheme()
  // TODO: make heading a proper gradient
  const color =
    colorProp === 'heading'
      ? theme.color.secondary.secondary
      : theme.color.text[colorProp]

  const variantStyles = variantStylesMap[variant]
  const t = theme.typography

  const textStyles: TextStyle = css({
    fontSize: t.size[variantStyles.fontSize[size]],
    lineHeight: t.lineHeight[variantStyles.lineHeight[size]],
    fontWeight: t.weight[variantStyles.fontWeight[strength]],
    fontFamily: t.fontByWeight[variantStyles.fontWeight[strength]],
    ...('css' in variantStyles ? variantStyles.css : {}),
    ...(color && { color }),
    ...(shadow && {
      textShadowColor: 'rgba(0, 0, 0, 0.50)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 5
    }),
    textAlign
  })

  const isHeading = variant === 'display' || variant === 'heading'

  return (
    <TextBase
      ref={ref}
      style={[styleProp, textStyles]}
      role={isHeading ? 'heading' : undefined}
      {...other}
    />
  )
})
