import { ReactNode, useCallback, useEffect, useState } from 'react'

import {
  Flex,
  IconCaretDown,
  IconComponent,
  TextColors,
  Text,
  useTheme,
  PlainButton,
  IconCaretUp
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
  extraItems?: SummaryTableItem[]
  onHideExtraItems?: () => void
  showExtraItemsCopy?: string
  hideExtraItemsCopy?: string
  disableExtraItemsToggle?: boolean
  summaryItem?: SummaryTableItem
  title: ReactNode
  secondaryTitle?: ReactNode
  summaryLabelColor?: TextColors
  summaryValueColor?: TextColors
  renderBody?: (items: SummaryTableItem[]) => ReactNode
}

const messages = {
  showAdvanced: 'Show advanced options',
  hideAdvanced: 'Hide advanced options'
}

export const SummaryTable = ({
  collapsible = false,
  items,
  extraItems,
  onHideExtraItems,
  showExtraItemsCopy,
  hideExtraItemsCopy,
  disableExtraItemsToggle,
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
  const onToggleExpand = useCallback(
    () => setExpanded((val) => !val),
    [setExpanded]
  )

  // Extra items are collapsed by default
  const [showExtraItems, setShowExtraItems] = useState(false)
  const onToggleExtraItems = useCallback(
    () => setShowExtraItems((val) => !val),
    [setShowExtraItems]
  )

  useEffect(() => {
    if (!showExtraItems) {
      onHideExtraItems?.()
    }
  }, [onHideExtraItems, showExtraItems])

  const renderHeader = () => {
    return (
      <Flex
        alignItems='center'
        alignSelf='stretch'
        justifyContent='space-between'
        pv='m'
        ph='xl'
        css={{
          backgroundColor: color.background.surface1,
          cursor: collapsible ? 'pointer' : 'auto'
        }}
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

  const renderMoreOptionsToggle = () => {
    return (
      <Flex p='xs'>
        <PlainButton
          onClick={onToggleExtraItems}
          iconRight={showExtraItems ? IconCaretUp : IconCaretDown}
          disabled={disableExtraItemsToggle}
        >
          {showExtraItems
            ? hideExtraItemsCopy || messages.hideAdvanced
            : showExtraItemsCopy || messages.showAdvanced}
        </PlainButton>
      </Flex>
    )
  }

  const renderContent = () => {
    const shownItems =
      showExtraItems && extraItems ? [...items, ...extraItems] : items
    return (
      <>
        {renderBodyProp
          ? renderBodyProp(shownItems)
          : shownItems.map(
              ({ id, label, icon: Icon, value, disabled, color }) => (
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
              )
            )}
        {renderSummaryItem()}
      </>
    )
  }

  return (
    <Flex direction='column' gap='l'>
      <Flex
        alignItems='center'
        alignSelf='stretch'
        justifyContent='center'
        direction='column'
        border='default'
        borderRadius='s'
        css={{ overflow: 'hidden' }}
      >
        {renderHeader()}
        {collapsible ? (
          <Expandable expanded={expanded}>{renderContent()}</Expandable>
        ) : (
          renderContent()
        )}
      </Flex>
      {extraItems ? renderMoreOptionsToggle() : null}
    </Flex>
  )
}
