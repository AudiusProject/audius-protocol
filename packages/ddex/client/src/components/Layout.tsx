import React from 'react'

import { Flex } from '@audius/harmony'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Flex>
      <main style={{ flexGrow: '1' }}>{children}</main>
    </Flex>
  )
}

export default Layout
