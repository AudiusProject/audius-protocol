import { useState } from 'react'

import { Flex, Button, TextInput, TextInputSize } from '@audius/harmony'

import {
  CollectionData,
  PaginatedTable
} from 'components/PaginatedTable/PaginatedTable'
import TableLayout from 'components/PaginatedTable/TableLayout'
import { trpc } from 'utils/trpc'

const Table = ({ data }: { data: CollectionData }) => {
  return (
    <>
      <thead>
        <tr>
          <th>Name (for matching)</th>
          <th>Handle</th>
          <th>Admin?</th>
          <th>Encoded ID</th>
          <th>Decoded ID</th>
        </tr>
      </thead>
      <tbody>
        {data.items.map((item: any) => (
          <tr key={item._id}>
            <td>{item.name}</td>
            <td>{item.handle}</td>
            <td>{item.isAdmin ? 'Yes' : 'No'}</td>
            <td>{item._id}</td>
            <td>{item.decodedUserId}</td>
          </tr>
        ))}
      </tbody>
    </>
  )
}

// TODO: Only show the "Create Test User" button when IS_DEV=true in the environment
const Users = () => {
  const [userName, setUserName] = useState('')
  const createUser = trpc.users.createUser.useMutation()

  const handleCreateUser = () => {
    if (userName.trim()) {
      createUser.mutate(
        { name: userName },
        {
          onSuccess: () => {
            setUserName('')
          },
          onError: (error) => {
            alert(`Error: ${error.message}`)
          }
        }
      )
    } else {
      alert('Please enter a name to create a user.')
    }
  }

  return (
    <TableLayout title='Releases'>
      <Flex
        direction='row'
        gap='s'
        alignItems='center'
        style={{ maxWidth: '400px' }}
      >
        <TextInput
          label='New Artist Name'
          placeholder='Enter artist name'
          value={userName}
          size={TextInputSize.SMALL}
          onChange={(e) => setUserName(e.target.value)}
        />
        <Button variant='secondary' size='small' onClick={handleCreateUser}>
          Create Test User
        </Button>
      </Flex>
      <PaginatedTable
        queryFunction={trpc.users.getUsers.useQuery}
        TableDisplay={Table}
      />
    </TableLayout>
  )
}

export default Users
