import { ReactNode, useState } from 'react'
import { Modal, Button, Group } from '@mantine/core'
import { UserListing, UserListingProps } from './UserListing'

type Props = UserListingProps & {
  children: ReactNode
}

export function UserListModal({ children, ...rest }: Props) {
  const [opened, setOpened] = useState(false)

  return (
    <>
      <Modal
        size="lg"
        padding={0}
        opened={opened}
        onClose={() => setOpened(false)}
        // instead of overflow inside, need some virtualized infinite scroller magic
        overflow="inside"
      >
        <UserListing {...rest} />
      </Modal>

      <div onClick={() => setOpened(true)}>{children}</div>
    </>
  )
}
