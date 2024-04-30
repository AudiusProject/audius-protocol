import { PlainButton, Flex, Box } from '@audius/harmony'
import { Link } from 'react-router-dom'

const AdminNavSidebar = () => {
  return (
    <aside
      style={{
        height: '100%'
      }}
    >
      <Box p='xl' borderRight='default'>
        <nav>
          <ul>
            <Flex direction='column' gap='xl'>
              <li>
                <Link to='/admin'>
                  <PlainButton size='large'>Deliveries</PlainButton>
                </Link>
              </li>
              <li>
                <Link to='/admin/releases'>
                  <PlainButton size='large'>Releases</PlainButton>
                </Link>
              </li>
              <li>
                <Link to='/admin/users'>
                  <PlainButton size='large'>Users</PlainButton>
                </Link>
              </li>
            </Flex>
          </ul>
        </nav>
      </Box>
    </aside>
  )
}

export default AdminNavSidebar
