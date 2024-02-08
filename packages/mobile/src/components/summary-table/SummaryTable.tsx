import type { ReactNode } from 'react'
import React, { useCallback, useState } from 'react'

import { removeNullable } from '@audius/common/utils'
import { LayoutAnimation, View } from 'react-native'

import type { TextColors } from '@audius/harmony-native'
import { Text } from '@audius/harmony-native'
import { Expandable, ExpandableArrowIcon } from 'app/components/expandable'
import { flexRowCentered, makeStyles } from 'app/styles'

const useStyles = makeStyles(({ spacing, palette }) => ({
  container: {
    borderColor: palette.neutralLight8,
    borderWidth: 1,
    borderRadius: spacing(1)
  },
  row: {
    ...flexRowCentered(),
    justifyContent: 'space-between',
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(6),
    borderBottomColor: palette.neutralLight8,
    borderBottomWidth: 1
  },
  lastRow: {
    borderBottomWidth: 0
  },
  grayRow: {
    backgroundColor: palette.neutralLight10
  },
  collapsibleTitle: {
    ...flexRowCentered(),
    gap: spacing(2)
  }
}))

export type SummaryTableItem = {
  id: string
  label: ReactNode
  value: ReactNode
  icon?: React.FC
  content?: ReactNode // expandable content
  disabled?: boolean
  color?: TextColors
}

export type SummaryTableProps = {
  items: SummaryTableItem[]
  summaryItem?: SummaryTableItem
  title: ReactNode
  secondaryTitle?: ReactNode
  summaryLabelColor?: TextColors
  summaryValueColor?: TextColors
  renderBody?: (items: SummaryTableItem[]) => ReactNode
  /** Enables an expand/collapse interaction. Only the title shows when collapsed. */
  collapsible?: boolean
}

export const SummaryTable = ({
  items,
  summaryItem,
  title,
  secondaryTitle,
  summaryLabelColor,
  summaryValueColor = 'accent',
  renderBody: renderBodyProp,
  collapsible = false
}: SummaryTableProps) => {
  const styles = useStyles()
  const nonNullItems = items.filter(removeNullable)
  const [isExpanded, setIsExpanded] = useState(false)

  const onToggleExpand = useCallback(() => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(180, 'easeInEaseOut', 'opacity')
    )
    setIsExpanded((expanded) => !expanded)
  }, [])

  const renderHeader = () => {
    return collapsible ? (
      <View style={[styles.row, styles.grayRow]}>
        <View style={styles.collapsibleTitle}>
          <ExpandableArrowIcon expanded={isExpanded} iconSize='s' />
          <Text variant='title' strength='default'>
            {title}
          </Text>
        </View>
        <Text variant='title' strength='default'>
          {secondaryTitle}
        </Text>
      </View>
    ) : (
      <View style={[styles.row, styles.grayRow]}>
        <Text variant='title' strength='default'>
          {title}
        </Text>
        <Text variant='title' strength='default'>
          {secondaryTitle}
        </Text>
      </View>
    )
  }

  const renderSummaryItem = () => {
    if (summaryItem === undefined) return null
    return (
      <View style={[styles.row, styles.lastRow, styles.grayRow]}>
        <Text
          variant='body'
          size='m'
          strength='strong'
          color={summaryLabelColor}
        >
          {summaryItem.label}
        </Text>
        <Text
          variant='body'
          size='m'
          strength='strong'
          color={summaryValueColor}
        >
          {summaryItem.value}
        </Text>
      </View>
    )
  }

  const renderContent = () => {
    return (
      <>
        {renderBodyProp
          ? renderBodyProp(items)
          : nonNullItems.map(({ id, label, value, color }, index) => (
              <View
                key={id}
                style={[
                  styles.row,
                  summaryItem === undefined && index === nonNullItems.length - 1
                    ? styles.lastRow
                    : null
                ]}
              >
                <Text variant='body'>{label}</Text>
                <Text variant='body' color={color}>
                  {value}
                </Text>
              </View>
            ))}
        {renderSummaryItem()}
      </>
    )
  }

  return collapsible ? (
    <Expandable
      style={styles.container}
      renderHeader={renderHeader}
      expanded={isExpanded}
      onToggleExpand={onToggleExpand}
    >
      {renderContent()}
    </Expandable>
  ) : (
    <View style={styles.container}>
      {renderHeader()}
      {renderContent()}
    </View>
  )
}
