import { ReactNode } from 'react'

import { ColorValue } from '@audius/stems'
import cn from 'classnames'

import { Text } from 'components/typography'

import styles from './SummaryTable.module.css'

export type SummaryTableItem = {
  id: string
  label: ReactNode
  value: ReactNode
}

export type SummaryTableProps = {
  items: SummaryTableItem[]
  summaryItem?: SummaryTableItem
  title: ReactNode
  secondaryTitle?: ReactNode
  summaryLabelColor?: ColorValue
  summaryValueColor?: ColorValue
}

export const SummaryTable = ({
  items,
  summaryItem,
  title,
  secondaryTitle,
  summaryLabelColor,
  summaryValueColor = 'secondary'
}: SummaryTableProps) => {
  return (
    <div className={styles.container}>
      <div className={styles.row}>
        <Text variant='title' size='large'>
          {title}
        </Text>
        <Text variant='title' size='large'>
          {secondaryTitle}
        </Text>
      </div>
      {items.map(({ id, label, value }) => (
        <div key={id} className={styles.row}>
          <Text>{label}</Text>
          <Text>{value}</Text>
        </div>
      ))}
      {summaryItem !== undefined ? (
        <div className={cn(styles.row, styles.rowGrayBackground)}>
          <Text variant='title' size='medium' color={summaryLabelColor}>
            {summaryItem.label}
          </Text>
          <Text variant='title' size='medium' color={summaryValueColor}>
            {summaryItem.value}
          </Text>
        </div>
      ) : null}
    </div>
  )
}
