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
  disabled?: boolean
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
    <Flex
      alignItems='center'
      alignSelf='stretch'
      justifyContent='center'
      direction='column'
      border='default'
      borderRadius='xs'
      className={styles.container}
    >
      <Flex
        alignItems='center'
        alignSelf='stretch'
        justifyContent='space-between'
        pv='m'
        ph='xl'
        className={styles.row}
      >
        <Text variant='title' size='large'>
          {title}
        </Text>
        <Text variant='title' size='large'>
          {secondaryTitle}
        </Text>
      </Flex>
      {items.map(({ id, label, icon: Icon, value, disabled }) => (
        <Flex
          key={id}
          alignItems='center'
          alignSelf='stretch'
          justifyContent='space-between'
          pv='m'
          ph='xl'
          className={styles.row}
          css={{ opacity: disabled ? 0.5 : 1 }}
        >
          <Flex alignItems='center' gap='s'>
            {withRadioOptions ? (
              <RadioButton value={id} disabled={disabled} />
            ) : null}
            {Icon ? (
              <Box ml='s'>
                <Icon color='default' />
              </Box>
            ) : null}
            <Text>{label}</Text>
          </Flex>
          <Text>{value}</Text>
        </Flex>
      ))}
      {summaryItem !== undefined ? (
        <Flex
          className={cn(styles.row, styles.rowGrayBackground)}
          alignItems='center'
          alignSelf='stretch'
          justifyContent='space-between'
          pv='m'
          ph='xl'
        >
          <Text variant='title' size='medium' color={summaryLabelColor}>
            {summaryItem.label}
          </Text>
          <Text variant='title' size='medium' color={summaryValueColor}>
            {summaryItem.value}
          </Text>
        </Flex>
      ) : null}
    </Flex>
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
