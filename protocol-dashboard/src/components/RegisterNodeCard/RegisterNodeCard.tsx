import { Box, Flex, Text } from '@audius/harmony'
import { Card } from 'components/Card/Card'
import { InfoBox } from 'components/InfoBox/InfoBox'
import { RegisterNewServiceBtn } from 'components/ManageService/RegisterNewServiceBtn'
import { REGISTER_NODE_DOCS_URL } from 'utils/routes'

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
        <InfoBox
          description={messages.registerNodeInfo}
          ctaText={messages.registerNodeInfoLink}
          ctaHref={REGISTER_NODE_DOCS_URL}
        />
      </Flex>
    </Card>
  )
}
