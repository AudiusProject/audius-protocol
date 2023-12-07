import { ReactNode, useCallback, useState } from 'react'

import { Flex, IconCaretDown, IconComponent, useTheme } from '@audius/harmony'
import { ColorValue } from '@audius/stems'
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
  disabled?: boolean
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
  renderBody?: (items: SummaryTableItem[]) => ReactNode
}

export const SummaryTable = ({
  collapsible = false,
  items,
  summaryItem,
  title,
  secondaryTitle,
  summaryLabelColor,
  summaryValueColor = 'secondary',
  renderBody: renderBodyProp
}: SummaryTableProps) => {
  const { color } = useTheme()
  // Collapsible is collapsed by default
  const [expanded, setExpanded] = useState(!collapsible)
  const onToggleExpand = useCallback(() => setExpanded((val) => !val), [])

  const renderHeader = () => {
    return (
      <Flex
        alignItems='center'
        alignSelf='stretch'
        justifyContent='space-between'
        pv='m'
        ph='xl'
        css={{ backgroundColor: color.background.surface1 }}
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
          <Text variant='title'>{title}</Text>
        </Flex>
        <Text variant='title'>{secondaryTitle}</Text>
      </Flex>
    )
  }

  const renderSummaryItem = () => {
    if (summaryItem === undefined) return null
    return (
      <Flex
        css={{ backgroundColor: color.background.surface1 }}
        alignItems='center'
        alignSelf='stretch'
        justifyContent='space-between'
        pv='m'
        ph='xl'
        borderTop='default'
      >
        <Text variant='title' size='medium' color={summaryLabelColor}>
          {summaryItem.label}
        </Text>
        <Text variant='title' size='medium' color={summaryValueColor}>
          {summaryItem.value}
        </Text>
      </Flex>
    )
  }

  const renderContent = () => {
    return (
      <>
        {renderBodyProp
          ? renderBodyProp(items)
          : items.map(({ id, label, icon: Icon, value, disabled }) => (
              <Flex
                key={id}
                alignItems='center'
                alignSelf='stretch'
                justifyContent='space-between'
                pv='m'
                ph='xl'
                css={{ opacity: disabled ? 0.5 : 1 }}
                borderTop='default'
              >
                <Flex
                  css={{ cursor: 'pointer' }}
                  alignItems='center'
                  justifyContent='space-between'
                  gap='s'
                >
                  {Icon ? (
                    <Flex alignItems='center' ml='s'>
                      <Icon color='default' />
                    </Flex>
                  ) : null}
                  <Text>{label}</Text>
                </Flex>
                <Text>{value}</Text>
              </Flex>
            ))}
        {renderSummaryItem()}
      </>
    )
  }

  return (
    <Flex
      alignItems='center'
      alignSelf='stretch'
      justifyContent='center'
      direction='column'
      border='default'
      borderRadius='xs'
      className={styles.container}
    >
      {renderHeader()}
      {collapsible ? (
        <Expandable expanded={expanded}>{renderContent()}</Expandable>
      ) : (
        renderContent()
      )}
    </Flex>
  )
}
