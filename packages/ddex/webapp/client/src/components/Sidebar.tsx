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
                  <PlainButton size='large'>Upload</PlainButton>
                </Link>
              </li>
              <li>
                <Link to='/indexed'>
                  <PlainButton size='large'>Indexed</PlainButton>
                </Link>
              </li>
              <li>
                <Link to='/parsed'>
                  <PlainButton size='large'>Parsed</PlainButton>
                </Link>
              </li>
              <li>
                <Link to='/published'>
                  <PlainButton size='large'>Published</PlainButton>
                </Link>
              </li>
            </Flex>
          </ul>
        </nav>
      </Box>
    </aside>
  )
}
