import { ComponentPropsWithoutRef, ReactNode } from 'react'

import cn from 'classnames'

import styles from './Block.module.css'

type BlockProps = {
  header: ReactNode
  children: ReactNode
} & ComponentPropsWithoutRef<'li'>

export const Block = ({
  header,
  children,
  className,
  ...divProps
}: BlockProps) => {
  return (
    <li className={cn(styles.block, className)} {...divProps}>
      <div className={styles.blockHeader}>{header}</div>
      <div className={styles.blockContent}>{children}</div>
    </li>
  )
}

export const BlockContainer = ({ children }: { children: ReactNode }) => {
  return <ul className={styles.blockContainer}>{children}</ul>
}
