import type { ReactNode } from 'react'

import { css } from '@emotion/native'
import { useFormikContext } from 'formik'
import { Dimensions, Platform, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import type {
  FlexProps,
  BoxProps,
  PaperProps,
  ButtonProps
} from '@audius/harmony-native'
import {
  Button,
  Divider,
  Flex,
  Paper,
  Text,
  spacing,
  useTheme
} from '@audius/harmony-native'
import { KeyboardAvoidingView } from 'app/components/core'

const messages = {
  continue: 'Continue'
}

type PageProps = FlexProps & {
  centered?: boolean
  noGutter?: boolean
}

// Horizontal gutter size
export const gutterSize: FlexProps['p'] = 'l'

export const Page = (props: PageProps) => {
  const { children, style, noGutter, ...other } = props

  const insets = useSafeAreaInsets()

  const layoutProps: FlexProps = {
    direction: 'column',
    h: '100%',
    gap: '2xl',
    ph: noGutter ? undefined : gutterSize,
    pv: 'xl',
    backgroundColor: 'white'
  }

  const isAndroid = Platform.OS === 'android'

  return (
    <>
      <Divider />
      {/* // 1 zIndex is to appear below */}
      <Flex
        {...layoutProps}
        style={[
          css({
            zIndex: 1,
            minHeight: isAndroid
              ? Dimensions.get('window').height - insets.top - insets.bottom
              : 0,
            // Offset the absolute positioned footer
            // calc = footer button height (48) + footer padding (2*spacing.l) + extra padding (spacing.xl)
            paddingBottom: 48 + spacing.l * 2 + spacing.xl
          }),
          style
        ]}
        {...other}
      >
        {children}
      </Flex>
    </>
  )
}

type PageFooterProps = {
  prefix?: ReactNode
  postfix?: ReactNode
  buttonProps?: Partial<ButtonProps>
  centered?: boolean
  avoidKeyboard?: boolean
} & Omit<PaperProps & BoxProps, 'prefix'>

export const PageFooter = (props: PageFooterProps) => {
  const { prefix, postfix, buttonProps, avoidKeyboard, ...other } = props
  const insets = useSafeAreaInsets()
  const { spacing } = useTheme()
  const { handleSubmit, dirty, isValid } = useFormikContext() ?? {}
  const KeyboardAvoidContainer = avoidKeyboard ? KeyboardAvoidingView : View

  return (
    <Flex
      gap='xl'
      // Have to escape the pre-existing Page padding
      w={Dimensions.get('window').width}
      style={css({
        position: 'absolute',
        bottom: insets.bottom === 0 ? spacing.l : 0,
        left: 0
      })}
    >
      {/* Prefixes float above the shadowed paper container  */}
      {prefix ? <Flex ph={gutterSize}>{prefix}</Flex> : null}
      <KeyboardAvoidContainer keyboardShowingOffset={spacing.unit5}>
        <Paper
          p='l'
          justifyContent='center'
          gap='l'
          alignItems='center'
          direction='column'
          shadow='midInverted'
          style={css({
            borderRadius: 0,
            paddingBottom: insets.bottom
          })}
          {...other}
        >
          <Button
            fullWidth
            disabled={!dirty || !isValid}
            onPress={() => handleSubmit?.()}
            {...buttonProps}
          >
            {messages.continue}
          </Button>
          {/* postfixes live insde the paper */}
          {postfix}
        </Paper>
      </KeyboardAvoidContainer>
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
  value: string | ReactNode
}

export const ReadOnlyField = (props: ReadOnlyFieldProps) => {
  const { label, value } = props

  return (
    <Flex gap='xs'>
      <Text variant='label' size='xs'>
        {label}
      </Text>
      <Text variant='body' size='m'>
        {value}
      </Text>
    </Flex>
  )
}
