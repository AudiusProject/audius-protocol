import type { ReactNode } from 'react'

import { css } from '@emotion/native'
import { Dimensions } from 'react-native'

import type { FlexProps, BoxProps, PaperProps } from '@audius/harmony-native'
import { Box, Flex, Paper, Text } from '@audius/harmony-native'
import { Button, type ButtonProps } from 'app/components/core'

type PageProps = FlexProps & {
  centered?: boolean
  offsetHeaderHeight?: boolean
}

// Horizontal gutter size
const gutterSize: FlexProps['p'] = 'l'

export const Page = (props: PageProps) => {
  const { children, style, offsetHeaderHeight, ...other } = props

  const layoutProps: FlexProps = {
    direction: 'column',
    // 196 = -96 (account header) + -100 (navigation height)
    h: offsetHeaderHeight ? Dimensions.get('window').height - 196 : '100%',
    gap: '2xl',
    ph: gutterSize,
    pv: '2xl',
    backgroundColor: 'white'
  }

  return (
    // 1 zIndex is to appear below AccountHeader
    <Flex {...layoutProps} style={[css({ zIndex: 1 }), style]} {...other}>
      {children}
    </Flex>
  )
}

type PageFooterProps = {
  prefix?: ReactNode
  postfix?: ReactNode
  buttonProps?: Partial<ButtonProps>
  centered?: boolean
  onSubmit?: () => void
} & Omit<PaperProps & BoxProps, 'prefix'>

export const PageFooter = (props: PageFooterProps) => {
  const { prefix, postfix, buttonProps, onSubmit, ...other } = props

  return (
    <Flex
      gap='xl'
      // Have to escape the pre-existing Page padding
      w={Dimensions.get('window').width}
      style={css({
        position: 'absolute',
        bottom: 0,
        left: 0
      })}
    >
      {/* Prefixes float above the shadowed paper container  */}
      <Flex ph={gutterSize}>{prefix}</Flex>
      <Paper
        p='l'
        justifyContent='center'
        gap='l'
        alignItems='center'
        direction='column'
        shadow='midInverted'
        style={css({
          borderRadius: 0
        })}
        {...other}
      >
        <Button
          fullWidth
          {...buttonProps}
          title='Continue'
          onPress={() => onSubmit?.()}
        />
        {/* postfixes live insde the paper */}
        {postfix}
      </Paper>
    </Flex>
  )
}

type HeadingProps = {
  prefix?: any
  postfix?: any
  heading: any
  description?: any
  centered?: boolean
} & Omit<FlexProps & BoxProps, 'prefix'>

export const Heading = (props: HeadingProps) => {
  const { prefix, heading, description, postfix, centered, ...other } = props

  return (
    <Flex
      gap='s'
      direction='column'
      alignItems={centered ? 'center' : undefined}
      {...other}
    >
      {prefix}
      <Text variant='heading' color='heading' size='m'>
        {heading}
      </Text>
      {description ? (
        <Text size='m' variant='body'>
          {description}
        </Text>
      ) : undefined}
      {postfix}
    </Flex>
  )
}

type ReadOnlyFieldProps = {
  label: string
  value: string
}

export const ReadOnlyField = (props: ReadOnlyFieldProps) => {
  const { label, value } = props

  return (
    <Box>
      <Text variant='label' size='xs'>
        {label}
      </Text>
      <Text variant='body' size='m'>
        {value}
      </Text>
    </Box>
  )
}
