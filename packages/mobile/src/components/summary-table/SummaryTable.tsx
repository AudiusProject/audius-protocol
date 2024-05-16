import type { ReactNode } from 'react'
import { useCallback, useState } from 'react'

import { removeNullable } from '@audius/common/utils'
import { LayoutAnimation } from 'react-native'

import type { TextColors } from '@audius/harmony-native'
import { Flex, Text } from '@audius/harmony-native'
import { Expandable, ExpandableArrowIcon } from 'app/components/expandable'
import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ spacing, palette }) => ({
  container: {
    borderColor: palette.neutralLight8,
    borderWidth: 1,
    borderRadius: spacing(1)
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
      <Flex
        direction='row'
        justifyContent='space-between'
        pv='m'
        ph='xl'
        backgroundColor='surface1'
        borderBottom={isExpanded ? 'default' : undefined}
      >
        <Flex direction='row' alignItems='center' gap='s'>
          <ExpandableArrowIcon expanded={isExpanded} iconSize='s' />
          <Text variant='title' strength='default'>
            {title}
          </Text>
        </Flex>
        <Text variant='title' strength='default'>
          {secondaryTitle}
        </Text>
      </Flex>
    ) : (
      <Flex
        direction='row'
        justifyContent='space-between'
        pv='m'
        ph='xl'
        backgroundColor='surface1'
        borderBottom='default'
      >
        <Text variant='title' strength='default'>
          {title}
        </Text>
        <Text variant='title' strength='default'>
          {secondaryTitle}
        </Text>
      </Flex>
    )
  }

  const renderSummaryItem = () => {
    if (summaryItem === undefined) return null
    return (
      <Flex
        direction='row'
        justifyContent='space-between'
        pv='m'
        ph='xl'
        backgroundColor='surface1'
      >
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
      </Flex>
    )
  }

  const renderContent = () => {
    const isLastRow = (index: number) =>
      summaryItem === undefined && index === nonNullItems.length - 1
    return (
      <>
        {renderBodyProp
          ? renderBodyProp(items)
          : nonNullItems.map(({ id, label, value, color }, index) => (
              <Flex
                direction='row'
                justifyContent='space-between'
                pv='m'
                ph='xl'
                backgroundColor={isLastRow(index) ? 'surface1' : undefined}
                borderBottom={isLastRow(index) ? undefined : 'default'}
                key={id}
              >
                <Text variant='body'>{label}</Text>
                <Text variant='body' color={color}>
                  {value}
                </Text>
              </Flex>
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
    <Flex border='default' borderRadius='s'>
      {renderHeader()}
      {renderContent()}
    </Flex>
  )
}
