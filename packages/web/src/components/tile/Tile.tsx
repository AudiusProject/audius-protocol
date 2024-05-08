import {
  ReactNode,
  ComponentType,
  ComponentProps,
  ElementType,
  forwardRef,
  Ref
} from 'react'

import { DogEarType } from '@audius/common/models'
import { Box, Flex } from '@audius/harmony'
import cn from 'classnames'

import { DogEar } from 'components/dog-ear'

import styles from './Tile.module.css'

type TileOwnProps<TileComponentType extends ElementType = 'div'> = {
  children: ReactNode
  size?: 'small' | 'medium' | 'large'
  as?: TileComponentType
  dogEar?: DogEarType
  elevation?: 'flat' | 'near' | 'mid' | 'far'
}

export type TileProps<TileComponentType extends ElementType> =
  TileOwnProps<TileComponentType> &
    Omit<ComponentProps<TileComponentType>, keyof TileOwnProps>

export const Tile = forwardRef(
  <T extends ElementType = ComponentType<ComponentProps<'div'>>>(
    props: TileProps<T>,
    ref: Ref<HTMLButtonElement>
  ) => {
    const {
      children,
      size,
      onClick,
      as: RootComponent = onClick ? 'button' : 'div',
      className,
      dogEar,
      elevation = 'near',
      ...other
    } = props

    return (
      <RootComponent
        className={cn(styles.root, className)}
        {...other}
        type={onClick ? 'button' : undefined}
        onClick={onClick}
        ref={ref}
      >
        {/* Dog ear needs to live outside the box to avoid overflow:hidden */}
        {dogEar ? <DogEar type={dogEar} /> : null}
        {/* This flex has all the internal tyle styles (border, bg, etc) */}
        <Flex
          className={cn([styles.tile, size && styles[size], styles[elevation]])}
          css={{ overflow: 'hidden' }}
          direction='column'
        >
          {children}
        </Flex>
      </RootComponent>
    )
  }
)
