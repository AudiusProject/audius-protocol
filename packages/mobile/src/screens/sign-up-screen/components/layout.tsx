import type { ReactNode } from 'react'
import { Children } from 'react'

import { css } from '@emotion/native'

import type { NativePaperProps } from '@audius/harmony-native'
import { Box, Paper, type NativeBoxProps } from '@audius/harmony-native'
import type { ButtonProps } from 'app/components/button'
import { Button } from 'app/components/core'
import { Flex } from 'app/harmony-native/components/layout/Flex/Flex'
import type { NativeFlexProps } from 'app/harmony-native/components/layout/Flex/types'
import { Text } from 'app/harmony-native/foundations/typography/Text'

import IconArrowRight from './temp-harmony/ArrowRight.svg'

type PageProps = NativeFlexProps & {
  centered?: boolean
}

export const Page = (props: PageProps) => {
  const { centered, children, ...other } = props

  const childrenArray = Children.toArray(children)
  const footer = childrenArray.pop()

  const layoutProps: NativeFlexProps = {
    direction: 'column',
    h: '100%',
    gap: '2xl',
    ph: 'l',
    pv: '2xl'
  }

  if (centered) {
    return (
      <Flex h='100%' direction='column' alignItems='center' {...other}>
        <Flex {...layoutProps} alignSelf='center'>
          {childrenArray}
        </Flex>
        {footer}
      </Flex>
    )
  }

  return (
    <Flex {...layoutProps} {...other}>
      {children}
    </Flex>
  )
}

type PageFooterProps = {
  prefix?: ReactNode
  postfix?: ReactNode
  buttonProps?: Partial<ButtonProps>
  centered?: boolean
  sticky?: boolean
} & Omit<NativePaperProps & NativeBoxProps, 'prefix'>

export const PageFooter = (props: PageFooterProps) => {
  const { prefix, postfix, buttonProps, centered, sticky, ...other } = props

  return (
    <Paper
      w='100%'
      p='l'
      justifyContent='center'
      gap='l'
      alignItems='center'
      direction='column'
      shadow={!sticky ? 'flat' : 'midInverted'}
      backgroundColor='white'
      style={css({
        // TODO: these aren't native friendly
        // overflow: 'unset',
        position: 'absolute',
        bottom: 0,
        left: 0,
        zIndex: 1,
        borderBottomRightRadius: 0,
        borderBottomLeftRadius: 0
      })}
      {...other}
    >
      {prefix}
      <Button
        type='submit'
        // TODO:
        // icon={IconArrowRight}
        fullWidth
        style={css(centered && { width: 343 })}
        {...buttonProps}
        title='Continue'
      />
      {postfix}
    </Paper>
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
