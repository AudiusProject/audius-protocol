import {
  ReactNode,
  ComponentType,
  ComponentProps,
  ElementType,
  forwardRef,
  Ref
} from 'react'

import cn from 'classnames'

import styles from './Tile.module.css'

type TileOwnProps<TileComponentType extends ElementType = 'div'> = {
  children: ReactNode
  size?: 'small' | 'medium' | 'large'
  as?: TileComponentType
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
      elevation = 'near',
      ...other
    } = props

    return (
      <RootComponent
        className={cn(
          styles.root,
          size && styles[size],
          styles[elevation],
          className
        )}
        type={onClick ? 'button' : undefined}
        onClick={onClick}
        ref={ref}
        {...other}
      >
        {children}
      </RootComponent>
    )
  }
)
