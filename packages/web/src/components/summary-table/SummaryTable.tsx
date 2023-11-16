import { ChangeEvent, ReactNode, useCallback, useState } from 'react'

import { Box, Flex, IconCaretDown, IconComponent } from '@audius/harmony'
import { ColorValue, RadioButton, RadioButtonGroup } from '@audius/stems'
import { ResizeObserver } from '@juggle/resize-observer'
import cn from 'classnames'
import useMeasure from 'react-use-measure'

import { Text } from 'components/typography'

import styles from './SummaryTable.module.css'

export type SummaryTableItem = {
  id: string
  label: ReactNode
  icon?: IconComponent
  value?: ReactNode
}

const Expandable = ({
  expanded,
  children
}: {
  expanded: boolean
  children: React.ReactNode
}) => {
  const [ref, bounds] = useMeasure({
    polyfill: ResizeObserver,
    offsetSize: true
  })

  return (
    <Flex
      direction='column'
      alignSelf='stretch'
      className={styles.expandableContainer}
      style={{ height: expanded ? bounds.height : 0 }}
    >
      <Flex direction='column' ref={ref}>
        {children}
      </Flex>
    </Flex>
  )
}

export type SummaryTableProps = {
  /** Enables an expand/collapse interaction. Only the title shows when collapsed. */
  collapsible?: boolean
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
  collapsible = false,
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
  // Collapsible is collapsed by default
  const [expanded, setExpanded] = useState(!collapsible)
  const onToggleExpand = useCallback(() => setExpanded((val) => !val), [])

  const body = (
    <>
      {items.map(({ id, label, icon: Icon, value }) => (
        <div key={id} className={styles.row}>
          <Flex alignItems='center' gap='s'>
            {withRadioOptions ? <RadioButton value={id} /> : null}
            {Icon ? (
              <Box ml='s'>
                <Icon color='default' />
              </Box>
            ) : null}
            <Text>{label}</Text>
          </Flex>
          <Text>{value}</Text>
        </div>
      ))}
      {summaryItem !== undefined ? (
        <div className={cn(styles.row, styles.highlightRow)}>
          <Text variant='title' size='medium' color={summaryLabelColor}>
            {summaryItem.label}
          </Text>
          <Text variant='title' size='medium' color={summaryValueColor}>
            {summaryItem.value}
          </Text>
        </div>
      ) : null}
    </>
  )

  const content = (
    <div className={styles.container}>
      <Text
        as='div'
        variant='title'
        className={cn(styles.row, styles.highlightRow, styles.titleRow)}
      >
        <Flex gap='s'>
          {collapsible ? (
            <IconCaretDown
              onClick={onToggleExpand}
              className={cn(styles.expander, { [styles.expanded]: expanded })}
              size='m'
              color='default'
            />
          ) : null}
          {title}
        </Flex>
        {secondaryTitle}
      </Text>
      {collapsible ? <Expandable expanded={expanded}>{body}</Expandable> : body}
    </div>
  )

  return withRadioOptions && onRadioChange ? (
    <RadioButtonGroup
      name={`summaryTable-label-${title}`}
      value={selectedRadioOption}
      onChange={onRadioChange}
      className={styles.radioGroup}
    >
      {content}
    </RadioButtonGroup>
  ) : (
    content
  )
}
