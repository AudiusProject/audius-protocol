import { ReactNode, useCallback, useState } from 'react'

import {
  Flex,
  IconCaretDown,
  IconComponent,
  TextColors,
  Text,
  useTheme
} from '@audius/harmony'

import { Expandable } from 'components/expandable/Expandable'

export type SummaryTableItem = {
  id: string
  label: ReactNode
  icon?: IconComponent
  value?: ReactNode
  disabled?: boolean
  color?: TextColors
}

export type SummaryTableProps = {
  /** Enables an expand/collapse interaction. Only the title shows when collapsed. */
  collapsible?: boolean
  items: SummaryTableItem[]
  summaryItem?: SummaryTableItem
  title: ReactNode
  secondaryTitle?: ReactNode
  summaryLabelColor?: TextColors
  summaryValueColor?: TextColors
  renderBody?: (items: SummaryTableItem[]) => ReactNode
}

export const SummaryTable = ({
  collapsible = false,
  items,
  summaryItem,
  title,
  secondaryTitle,
  summaryLabelColor,
  summaryValueColor = 'accent',
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
        css={{ backgroundColor: color.background.surface1, cursor: 'pointer' }}
        onClick={onToggleExpand}
      >
        <Flex gap='s'>
          {collapsible ? (
            <IconCaretDown
              css={{
                transition: 'transform var(--harmony-expressive)',
                transform: `rotate(${expanded ? -180 : 0}deg)`
              }}
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
        <Text variant='title' size='m' color={summaryLabelColor}>
          {summaryItem.label}
        </Text>
        <Text variant='title' size='m' color={summaryValueColor}>
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
          : items.map(({ id, label, icon: Icon, value, disabled, color }) => (
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
                  <Text variant='body' size='m'>
                    {label}
                  </Text>
                </Flex>
                <Text variant='body' size='m' color={color}>
                  {value}
                </Text>
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
      css={{ overflow: 'hidden' }}
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
