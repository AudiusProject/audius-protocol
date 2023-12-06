import type { ReactNode } from 'react'
import { Children } from 'react'

import { css } from '@emotion/native'
import { Dimensions } from 'react-native'

import type { NativePaperProps } from '@audius/harmony-native'
import { Box, Paper, type NativeBoxProps } from '@audius/harmony-native'
import type { ButtonProps } from 'app/components/core'
import { Button } from 'app/components/core'
import { Flex } from 'app/harmony-native/components/layout/Flex/Flex'
import type { NativeFlexProps } from 'app/harmony-native/components/layout/Flex/types'
import { Text } from 'app/harmony-native/foundations/typography/Text'

type PageProps = NativeFlexProps & {
  centered?: boolean
}

// Horizontal gutter size
const gutterSize: NativeFlexProps['p'] = 'l'

export const Page = (props: PageProps) => {
  const { children, style, ...other } = props

  const layoutProps: NativeFlexProps = {
    direction: 'column',
    h: '100%',
    gap: '2xl',
    ph: gutterSize,
    pv: '2xl',
    backgroundColor: 'white'
  }

  return (
    <Flex {...layoutProps} style={[style]} {...other}>
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
} & Omit<NativePaperProps & NativeBoxProps, 'prefix'>

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
          onPress={() => onSubmit()}
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
} & Omit<NativeFlexProps & NativeBoxProps, 'prefix'>

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
