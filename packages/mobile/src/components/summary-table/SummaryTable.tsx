import type { ReactNode } from 'react'
import React, { useRef, useCallback } from 'react'

import { removeNullable } from '@audius/common'
import { Animated, View } from 'react-native'

import IconCaretDown from 'app/assets/images/iconCaretDown.svg'
import { Text } from 'app/components/core'
import { Expandable, useExpandable } from 'app/components/expandable'
import { flexRowCentered, makeStyles } from 'app/styles'
import { useThemeColors, type ThemeColors } from 'app/utils/theme'

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
}

export type SummaryTableProps = {
  items: SummaryTableItem[]
  summaryItem?: SummaryTableItem
  title: ReactNode
  secondaryTitle?: ReactNode
  summaryLabelColor?: keyof ThemeColors
  summaryValueColor?: keyof ThemeColors
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
  summaryValueColor = 'secondary',
  renderBody: renderBodyProp,
  collapsible = false
}: SummaryTableProps) => {
  const styles = useStyles()
  const { neutral } = useThemeColors()
  const nonNullItems = items.filter(removeNullable)
  const rotateAnim = useRef(new Animated.Value(0))

  const { isExpanded, setIsExpanded, springToValue } = useExpandable()
  const onExpand = useCallback(() => {
    springToValue({
      animation: rotateAnim.current,
      value: isExpanded ? 0 : 180
    })
  }, [isExpanded, springToValue])

  const renderHeader = () => {
    return collapsible ? (
      <View style={[styles.row, styles.grayRow]}>
        <View style={styles.collapsibleTitle}>
          <Animated.View
            style={{
              transform: [
                {
                  rotate: rotateAnim.current.interpolate({
                    inputRange: [0, 180],
                    outputRange: ['0deg', '-180deg']
                  })
                }
              ]
            }}
          >
            <IconCaretDown width={16} height={16} fill={neutral} />
          </Animated.View>
          <Text weight='bold'>{title}</Text>
        </View>
        <Text variant='body' fontSize='large' weight='bold'>
          {secondaryTitle}
        </Text>
      </View>
    ) : (
      <View style={[styles.row, styles.grayRow]}>
        <Text weight='bold'>{title}</Text>
        <Text variant='body' fontSize='large' weight='bold'>
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
          fontSize='medium'
          weight='bold'
          color={summaryLabelColor}
        >
          {summaryItem.label}
        </Text>
        <Text
          variant='body'
          fontSize='medium'
          weight='bold'
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
          : nonNullItems.map(({ id, label, value }, index) => (
              <View
                key={id}
                style={[
                  styles.row,
                  summaryItem === undefined && index === nonNullItems.length - 1
                    ? styles.lastRow
                    : null
                ]}
              >
                <Text>{label}</Text>
                <Text>{value}</Text>
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
      isExpanded={isExpanded}
      setIsExpanded={setIsExpanded}
      onExpand={onExpand}
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
