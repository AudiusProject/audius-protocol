import { PlainButton, Flex, Box } from '@audius/harmony'
import { Link } from 'react-router-dom'

const AdminNavSidebar = () => {
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
                <Link to='/admin'>
                  <PlainButton size='large'>Uploads</PlainButton>
                </Link>
              </li>
              <li>
                <Link to='/admin/deliveries'>
                  <PlainButton size='large'>Indexed Deliveries</PlainButton>
                </Link>
              </li>
              <li>
                <Link to='/admin/pending-releases'>
                  <PlainButton size='large'>Pending Releases</PlainButton>
                </Link>
              </li>
              <li>
                <Link to='/admin/published-releases'>
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

export default AdminNavSidebar
