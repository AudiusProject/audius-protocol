import {
  Children,
  ComponentType,
  ElementType,
  ReactNode,
  forwardRef,
  useContext,
  RefObject
} from 'react'

import { Maybe } from '@audius/common'
import {
  Box,
  BoxProps,
  Button,
  ButtonProps,
  Flex,
  FlexProps,
  IconArrowRight,
  Paper,
  PaperProps,
  Text
} from '@audius/harmony'
import styled, { CSSObject } from '@emotion/styled'
import { animated, useSpring } from '@react-spring/web'
import { useFormikContext } from 'formik'

import { useMedia } from 'hooks/useMedia'

import { RouteContext } from '../utils/RouteContext'

import { AccountHeader } from './AccountHeader'

const messages = {
  continue: 'Continue'
}

type PageProps = FlexProps & {
  as?: ComponentType<any>
  centered?: boolean
  transition?: 'horizontal' | 'vertical'
  transitionBack?: 'horizontal' | 'vertical'
  autoFocusInputRef?: RefObject<HTMLInputElement>
}

const transitionAxisConfig = {
  horizontal: 'X',
  vertical: 'Y'
}

const AnimatedFlex = animated(Flex)

export const Page = (props: PageProps) => {
  const {
    centered,
    children,
    as,
    transition,
    transitionBack,
    autoFocusInputRef,
    ...other
  } = props
  const { isMobile } = useMedia()
  const { isGoBack } = useContext(RouteContext)

  const translateAxis =
    transitionAxisConfig[
      (isGoBack ? transitionBack ?? transition : transition) ?? 'horizontal'
    ]

  const translateStart = isGoBack ? '-100%' : '100%'
  const shouldTransition = transition || isGoBack

  const fromTransform = shouldTransition
    ? `translate${translateAxis}(${translateStart})`
    : undefined

  const toTransform = shouldTransition
    ? `translate${translateAxis}(0%)`
    : undefined

  const styles = useSpring({
    from: {
      opacity: 0,
      transform: fromTransform
    },
    to: {
      opacity: 1,
      transform: toTransform
    },
    onRest: () => {
      autoFocusInputRef?.current?.focus()
    }
  })

  const childrenArray = Children.toArray(children)

  let accountHeader
  if ((childrenArray[0] as JSX.Element).type.name === AccountHeader.name) {
    accountHeader = childrenArray.shift()
  }
  const footer = childrenArray.pop()

  const layoutProps: FlexProps = {
    direction: 'column',
    gap: '2xl',
    ph: isMobile ? 'l' : '2xl',
    pv: 'xl'
  }

  if (centered) {
    return (
      <Flex
        flex={1}
        direction='column'
        alignItems='center'
        style={{ overflow: 'auto' }}
        as={as}
      >
        {accountHeader}
        <AnimatedFlex
          {...layoutProps}
          {...other}
          alignSelf='center'
          // css={!isMobile && { maxWidth: 610 }}
          style={{ ...styles }}
        >
          {childrenArray}
        </AnimatedFlex>
        {footer}
      </Flex>
    )
  }

  return (
    <AnimatedFlex
      as={as}
      flex={1}
      {...layoutProps}
      {...other}
      css={
        isMobile ? { maxWidth: 477, width: '100%', margin: 'auto' } : undefined
      }
      style={styles}
    >
      {children}
    </AnimatedFlex>
  )
}

type HeadingProps = {
  prefix?: ReactNode
  postfix?: ReactNode
  heading: ReactNode
  tag?: ElementType
  description?: ReactNode
  centered?: boolean
} & Omit<FlexProps & BoxProps, 'prefix'>

export const Heading = forwardRef<HTMLDivElement, HeadingProps>(
  (props, ref) => {
    const { prefix, heading, description, postfix, centered, tag, ...other } =
      props
    const { isMobile } = useMedia()

    const textCss: Maybe<CSSObject> = centered
      ? { textAlign: 'center' }
      : undefined

    return (
      <Flex
        ref={ref}
        gap={isMobile ? 's' : 'l'}
        direction='column'
        alignItems={centered ? 'center' : undefined}
        {...other}
      >
        {prefix}
        <Text
          variant='heading'
          color='accent'
          size={isMobile ? 'm' : 'l'}
          tag={tag}
          css={textCss}
        >
          {heading}
        </Text>
        {description ? (
          <Text size={isMobile ? 'm' : 'l'} variant='body' css={textCss}>
            {description}
          </Text>
        ) : null}
        {postfix}
      </Flex>
    )
  }
)

type PageFooterProps = {
  prefix?: ReactNode
  postfix?: ReactNode
  buttonProps?: ButtonProps
  centered?: boolean
  sticky?: boolean
} & Omit<PaperProps & BoxProps, 'prefix'>

export const PageFooter = (props: PageFooterProps) => {
  const { prefix, postfix, buttonProps, centered, sticky, ...other } = props
  const { isMobile } = useMedia()
  // On the MobileCTAPage we use this footer outside a formik context
  const { isSubmitting } = useFormikContext() ?? { isSubmitting: false }

  return (
    <Paper
      w='100%'
      p='l'
      justifyContent='center'
      gap='l'
      alignItems='center'
      direction='column'
      shadow={isMobile && !sticky ? 'flat' : 'midInverted'}
      backgroundColor='white'
      css={{
        overflow: 'unset',
        flexShrink: 0,
        zIndex: 1,
        ...(sticky && { position: 'sticky', bottom: 0 }),
        borderBottomRightRadius: 0,
        borderBottomLeftRadius: 0
      }}
      {...other}
    >
      {prefix}
      <Button
        type='submit'
        iconRight={IconArrowRight}
        fullWidth
        isLoading={isSubmitting}
        css={!isMobile && centered && { width: 343 }}
        {...buttonProps}
      >
        {messages.continue}
      </Button>
      {postfix}
    </Paper>
  )
}

type ReadOnlyFieldProps = {
  label: string
  value: string | ReactNode
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

type ScrollViewProps = {
  as?: ComponentType<any>
  orientation?: 'horizontal' | 'vertical'
  disableScroll?: boolean
} & FlexProps &
  BoxProps

export const ScrollView = (props: ScrollViewProps) => {
  const { children, orientation = 'vertical', disableScroll, ...other } = props

  return (
    <Flex
      w='100%'
      h='100%'
      direction={orientation === 'vertical' ? 'column' : 'row'}
      css={{
        overflow: disableScroll ? undefined : 'auto',
        // Hide scrollbar
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none', // IE + Edge
        // Chrome + Safari
        '::-webkit-scrollbar': {
          display: 'none'
        }
      }}
      {...other}
    >
      {children}
    </Flex>
  )
}

export const HiddenLegend = styled.legend({
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  border: 0
})
