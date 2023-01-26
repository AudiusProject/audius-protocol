import { ReactNode, useState } from 'react'
import { Button, CloseButton, Group, Modal, Text } from '@mantine/core'
import { UserListing, UserListingProps } from './UserListing'

type Props = UserListingProps & {
  title: string
  children: ReactNode
}

export function UserListModal({ title, children, ...rest }: Props) {
  const [opened, setOpened] = useState(false)

  return (
    <>
      <Modal
        size="lg"
        padding={0}
        opened={opened}
        onClose={() => setOpened(false)}
        withCloseButton={false}
      >
        <Group p={12}>
          <Text sx={{ flexGrow: 1 }} fz={24} fw={700}>
            {title}
          </Text>
          <CloseButton
            aria-label="Close modal"
            onClick={() => setOpened(false)}
          />
        </Group>
        <UserListing {...rest} />
      </Modal>

      <div onClick={() => setOpened(true)}>{children}</div>
    </>
  )
}
