import { Box, Flex, IconQuestionCircle, Text } from '@audius/harmony'
import { Card } from 'components/Card/Card'
import { PlainLink } from 'components/PlainLink/PlainLink'
import { RegisterNewServiceBtn } from 'components/ManageService/RegisterNewServiceBtn'

const messages = {
  registerNode: 'Register a Node',
  registerNodeInfo:
    'Node operators run the decentralized infrastructure that powers the Audius Network.  To learn more about running a node, please visit our help center.',
  registerNodeInfoLink: 'Running an Audius Node',
  registerNodeCta: 'Register Node'
}

export const RegisterNodeCard = () => {
  return (
    <Card direction="column">
      <Flex
        pv="2xl"
        ph="xl"
        borderBottom="default"
        justifyContent="space-between"
        alignItems="center"
      >
        <Box>
          <Text variant="heading" size="s">
            {messages.registerNode}
          </Text>
        </Box>
        <Box>
          <RegisterNewServiceBtn />
        </Box>
      </Flex>
      <Flex ph="xl" pv="l" gap="xl">
        <Card backgroundColor="surface2" pv="m" ph="l" gap="l">
          <Box pv="s">
            <IconQuestionCircle size="2xl" color="default" />
          </Box>
          <Flex direction="column" gap="m">
            <Text variant="body" size="m" strength="default">
              {messages.registerNodeInfo}
            </Text>
            <PlainLink href="https://docs.audius.org/token/running-a-node/setup/registration">
              {messages.registerNodeInfoLink}
            </PlainLink>
          </Flex>
        </Card>
      </Flex>
    </Card>
  )
}
