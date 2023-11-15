/** @jsx jsx */

// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { jsx } from '@emotion/react'
import { useTheme } from '@storybook/theming'

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
    <div
      css={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}
    >
      <span>{name}</span>
      <div
        css={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 18,
          paddingLeft: 8,
          paddingRight: 8,
          borderRadius: 4,
          border: `1px solid ${statusColor}`,
          color: statusColor
        }}
      >
        {status}
      </div>
    </div>
  )
}
