/** @jsx jsx */

// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { jsx } from '@emotion/react'
import { useTheme } from '@storybook/theming'

import { Box } from '../../components/layout/Box'
import { Flex } from '../../components/layout/Flex'

type SidebarItemProps = {
  name: string
  status: string
}

export const SidebarItem = (props: SidebarItemProps) => {
  const { name, status } = props
  const theme = useTheme()
  const statusColor =
    status === 'deprecated'
      ? 'var(--harmony-docs-deprecated-color)'
      : theme.barSelectedColor

  return (
    <Flex justifyContent='space-between' css={{ width: '100%' }}>
      <Box as='div'>{name}</Box>
      <Flex
        justifyContent='center'
        alignItems='center'
        as='div'
        ph='s'
        css={{
          height: '18px',
          borderRadius: '4px',
          border: `1px solid ${statusColor}`,
          color: statusColor
        }}
      >
        {status}
      </Flex>
    </Flex>
  )
}
