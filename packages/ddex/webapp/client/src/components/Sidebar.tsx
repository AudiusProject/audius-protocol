import React from 'react'

import { PlainButton, Flex, Box } from '@audius/harmony'
import { Link } from 'react-router-dom'

export const Sidebar: React.FC = () => {
  return (
    <aside
      style={{
        flexGrow: '1',
        height: '100%'
      }}
    >
      <Box p='xl' borderRight='default'>
        <nav>
          <ul>
            <Flex direction='column' gap='xl'>
              <li>
                <Link to='/'>
                  <PlainButton size='large'>Uploads</PlainButton>
                </Link>
              </li>
              <li>
                <Link to='/deliveries'>
                  <PlainButton size='large'>Indexed Deliveries</PlainButton>
                </Link>
              </li>
              <li>
                <Link to='/pending-releases'>
                  <PlainButton size='large'>Pending Releases</PlainButton>
                </Link>
              </li>
              <li>
                <Link to='/published-releases'>
                  <PlainButton size='large'>Published Releases</PlainButton>
                </Link>
              </li>
            </Flex>
          </ul>
        </nav>
      </Box>
    </aside>
  )
}
