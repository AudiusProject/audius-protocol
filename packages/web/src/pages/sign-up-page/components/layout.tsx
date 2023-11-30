import { Children, ComponentType, ReactNode, forwardRef } from 'react'

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

import { useMedia } from 'hooks/useMedia'

const messages = {
  continue: 'Continue'
}

type PageProps = FlexProps & {
  as?: ComponentType<any>
  centered?: boolean
}

export const Page = (props: PageProps) => {
  const { centered, children, as, ...other } = props
  const { isMobile } = useMedia()

  const childrenArray = Children.toArray(children)
  const footer = childrenArray.pop()

  const layoutProps: FlexProps = {
    direction: 'column',
    h: '100%',
    gap: '2xl',
    ph: isMobile ? 'l' : '2xl',
    pv: 'xl'
  }

  if (centered) {
    return (
      <Flex h='100%' direction='column' alignItems='center' as={as}>
        <Flex
          {...layoutProps}
          {...other}
          alignSelf='center'
          css={!isMobile && { maxWidth: 610 }}
        >
          {childrenArray}
        </Flex>
        {footer}
      </Flex>
    )
  }

  return (
    <Flex as={as} {...layoutProps} {...other}>
      {children}
    </Flex>
  )
}

type HeadingProps = {
  prefix?: ReactNode
  postfix?: ReactNode
  heading: ReactNode
  description?: ReactNode
  centered?: boolean
} & Omit<FlexProps & BoxProps, 'prefix'>

export const Heading = forwardRef<HTMLDivElement, HeadingProps>(
  (props, ref) => {
    const { prefix, heading, description, postfix, centered, ...other } = props
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
        <Text variant='heading' color='accent' size={isMobile ? 'm' : 'l'}>
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
  const { isMobile } = useMedia()

  return (
    <Flex
      w='100%'
      direction={orientation === 'vertical' ? 'column' : 'row'}
      gap={isMobile ? '2xl' : '3xl'}
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
