import React, { useState, useCallback, ReactNode } from 'react'
import cn from 'classnames'
import { Button, ButtonType } from '@audius/stems'

import styles from './Section.module.css'

const messages = {
  more: 'More'
}

export enum Layout {
  // Nothing special
  NORMAL = 'normal',
  // Two-columns with an alternating pattern of wide, medium, and narrow
  TWO_COLUMN_DYNAMIC = 'two-column-dynamic',
  // Two-columns with rows of 100%x1, 50%x2, 33%x3, 67% 33% in that order
  TWO_COLUMN_DYNAMIC_WITH_LEADING_ELEMENT = 'two-column-dynamic-with-leading-element'
}

type SectionProps = {
  title: string
  subtitle?: string
  expandable?: boolean
  expandText?: string
  layout?: Layout
  className?: string
  children?: JSX.Element | JSX.Element[] | ReactNode
}

const Section = ({
  title,
  subtitle,
  expandable,
  expandText,
  layout,
  className,
  children
}: SectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const expand = useCallback(() => {
    setIsExpanded(true)
  }, [setIsExpanded])

  return (
    <div
      className={cn(styles.section, className, {
        [styles.twoColumnDynamic]: layout === Layout.TWO_COLUMN_DYNAMIC,
        [styles.twoColumnDynamicWithLeadingElement]:
          layout === Layout.TWO_COLUMN_DYNAMIC_WITH_LEADING_ELEMENT,
        [styles.expandable]: expandable,
        [styles.expanded]: isExpanded
      })}
    >
      <div className={styles.title}>{title}</div>
      <div className={styles.subtitle}>{subtitle}</div>
      <div className={styles.children}>{children}</div>
      {expandable && !isExpanded && (
        <Button
          className={styles.expandButton}
          textClassName={styles.expandButtonText}
          type={ButtonType.PRIMARY_ALT}
          text={expandText || messages.more}
          onClick={expand}
        />
      )}
    </div>
  )
}

export default Section
