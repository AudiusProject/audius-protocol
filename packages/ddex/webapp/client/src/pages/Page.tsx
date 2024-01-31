import { ReactNode } from 'react'

import { Box, Flex } from '@audius/harmony'

import { Banner } from 'components/Banner/Banner'
import { Sidebar } from 'components/Sidebar'

export const Page = ({ children }: { children: ReactNode }) => {
  return (
    <Flex>
      <Sidebar />
      <div style={{ flexGrow: '5' }}>
        <Flex direction='column'>
          <Banner />
          <Box
            p='xl'
            backgroundColor='surface2'
            borderTop='strong'
            style={{ height: '100vh' }}
          >
            {children}
          </Box>
        </Flex>
      </div>
    </Flex>
  )
}
