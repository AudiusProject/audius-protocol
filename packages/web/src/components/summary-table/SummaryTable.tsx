import { ChangeEvent, ReactNode } from 'react'

import { Box, Flex, IconComponent } from '@audius/harmony'
import { ColorValue, RadioButton, RadioButtonGroup } from '@audius/stems'
import cn from 'classnames'

import { Text } from 'components/typography'

import styles from './SummaryTable.module.css'

export type SummaryTableItem = {
  id: string
  label: ReactNode
  icon?: IconComponent
  value?: ReactNode
}

export type SummaryTableProps = {
  items: SummaryTableItem[]
  summaryItem?: SummaryTableItem
  title: ReactNode
  secondaryTitle?: ReactNode
  summaryLabelColor?: ColorValue
  summaryValueColor?: ColorValue
  withRadioOptions?: boolean
  selectedRadioOption?: string
  onRadioChange?: (e: ChangeEvent<HTMLInputElement>) => void
}

export const SummaryTable = ({
  items,
  summaryItem,
  title,
  secondaryTitle,
  summaryLabelColor,
  summaryValueColor = 'secondary',
  withRadioOptions,
  selectedRadioOption,
  onRadioChange
}: SummaryTableProps) => {
  const body = (
    <div className={styles.container}>
      <div className={styles.row}>
        <Text variant='title' size='large'>
          {title}
        </Text>
        <Text variant='title' size='large'>
          {secondaryTitle}
        </Text>
      </div>
      {items.map(({ id, label, icon: Icon, value }) => (
        <div key={id} className={styles.row}>
          <Flex alignItems='center' gap='s'>
            {withRadioOptions ? <RadioButton value={id} /> : null}
            {Icon ? (
              <Box ml='s'>
                <Icon
                  color='default'
                />
              </Box>
            ) : null}
            <Text>{label}</Text>
          </Flex>
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

  return withRadioOptions && onRadioChange ? (
    <RadioButtonGroup
      name={`summaryTable-label-${title}`}
      value={selectedRadioOption}
      onChange={onRadioChange}
      className={styles.radioGroup}
    >
      {body}
    </RadioButtonGroup>
  ) : (
    body
  )
}
