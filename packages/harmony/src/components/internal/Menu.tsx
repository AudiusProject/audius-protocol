import { ReactNode, Ref } from 'react'

import { CSSObject } from '@emotion/react'

import { Flex, FlexProps } from 'components/layout/Flex'
import { Paper, PaperProps } from 'components/layout/Paper'
import { Popup } from 'components/popup/Popup'
import { PopupProps } from 'components/popup/types'
import { WithCSS } from 'foundations'

// TODO menu label

export type MenuProps = Omit<PopupProps, 'children'> & {
  maxHeight?: CSSObject['maxHeight']
  width?: CSSObject['width']
  children: ReactNode
  PaperProps?: WithCSS<Partial<PaperProps>>
  MenuListProps?: WithCSS<Partial<FlexProps>>
  scrollRef: Ref<HTMLDivElement>
}

export const Menu = (props: MenuProps) => {
  const {
    children,
    maxHeight,
    width,
    PaperProps,
    MenuListProps,
    scrollRef,
    ...other
  } = props

  return (
    <Popup {...other}>
      <Paper mt='s' border='strong' shadow='far' {...PaperProps}>
        <Flex
          direction='column'
          p='s'
          gap='s'
          alignItems='flex-start'
          role='listbox'
          css={{ maxHeight, width, overflowY: 'auto' }}
          ref={scrollRef}
          {...MenuListProps}
        >
          {children}
        </Flex>
      </Paper>
    </Popup>
  )
}
