import { ReactNode } from 'react'

import { Box, Flex, Text } from '@audius/harmony'

const TableLayout = ({
  title,
  children
}: {
  title: string
  children: ReactNode
}) => {
  return (
    <Box borderRadius='s' shadow='near' p='xl' backgroundColor='white'>
      <Flex direction='column' gap='l'>
        <Text variant='heading' color='heading'>
          {title}
        </Text>
        {children}
      </Flex>
    </Box>
  )
}

export default TableLayout
