import {
  Children,
  ComponentType,
  ElementType,
  ReactNode,
  forwardRef
} from 'react'

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
import styled from '@emotion/styled'
import { animated, useSpring } from '@react-spring/web'

import { useMedia } from 'hooks/useMedia'

const messages = {
  continue: 'Continue'
}

type PageProps = FlexProps & {
  as?: ComponentType<any>
  centered?: boolean
  transition?: 'horizontal' | 'vertical'
}

const AnimatedFlex = animated(Flex)

export const Page = (props: PageProps) => {
  const { centered, children, as, transition, ...other } = props
  const { isMobile } = useMedia()

  const styles = useSpring({
    from: {
      opacity: 0,
      transform: transition
        ? transition === 'vertical'
          ? 'translateY(100%)'
          : 'translateX(100%)'
        : undefined
    },
    to: {
      opacity: 1,
      transform: transition
        ? transition === 'vertical'
          ? 'translateY(0%)'
          : 'translateX(0%)'
        : undefined
    }
  })

  const childrenArray = Children.toArray(children)
  const footer = childrenArray.pop()

  const layoutProps: FlexProps = {
    direction: 'column',
    // flex: 1,
    h: '100%',
    gap: '2xl',
    ph: isMobile ? 'l' : '2xl',
    pv: 'xl'
  }

  if (centered) {
    return (
      <Flex h='100%' direction='column' alignItems='center' as={as}>
        <AnimatedFlex
          {...layoutProps}
          {...other}
          alignSelf='center'
          css={!isMobile && { maxWidth: 610 }}
          style={styles}
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
        >
          {heading}
        </Text>
        {description ? (
          <Text size={isMobile ? 'm' : 'l'} variant='body'>
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
        position: sticky ? 'sticky' : 'absolute',
        bottom: 0,
        left: 0,
        zIndex: 1,
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
