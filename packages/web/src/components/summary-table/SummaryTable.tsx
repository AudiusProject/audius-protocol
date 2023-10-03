import { ReactNode } from 'react'

import { Text } from 'components/typography'

import styles from './SummaryTable.module.css'

export type SummaryTableItem = {
  id: string
  label: ReactNode
  value: ReactNode
}

export type SummaryTableProps = {
  items: SummaryTableItem[]
  summaryItem: SummaryTableItem
  title: ReactNode
}

export const SummaryTable = ({
  items,
  summaryItem,
  title
}: SummaryTableProps) => {
  return (
    <div className={styles.container}>
      <Text className={styles.row} variant='title' size='large'>
        {title}
      </Text>
      {items.map(({ id, label, value }) => (
        <div key={id} className={styles.row}>
          <Text>{label}</Text>
          <Text>{value}</Text>
        </div>
      ))}
      <div className={styles.row}>
        <Text variant='title' size='medium'>
          {summaryItem.label}
        </Text>
        <Text variant='title' size='medium' color='secondary'>
          {summaryItem.value}
        </Text>
      </div>
    </div>
  )
}
