import {
  Box,
  Text,
  Flex,
  IconCaretLeft,
  useTheme,
  IconTriangleExclamation,
  Divider,
  IconQuestionCircle,
  IconVisibilityHidden,
  IconLifeRing,
  TextLink,
  Button
} from '@audius/harmony'
import { Switch } from '@audius/stems'

import Page from 'components/page/Page'

const messages = {
  backToSettings: 'Back To Settings',
  showPrivateKey: 'Show Private Key',
  yourOwnRisk: 'Use At Your Own Risk',
  what: 'What does this do?',
  thisTool:
    'This tool is able to display the address and private key associated with your Audius account. Your private key grants anyone who possesses it complete access to your Audius account.',
  advancedUsers:
    'Advanced users may be able to utilize this to enable experiences outside of the Audius ecosystem, but doing so exposes you to great risk.',
  note: 'Note: This wallet will not contain in-app $AUDIO balances.',
  understandTheRisk: 'Understand the Risks',
  improperUse:
    'Improper use can cause irreversible damage. This includes, but is not limited to:',
  untrustworthyParties:
    'Granting untrustworthy parties complete control over your account.',
  compromisingSecurity:
    'Compromising the security of any connected wallets, and services.',
  lossOfFunds: 'Loss of funds.',
  unforeseenConsequences:
    'Other unforeseen consequences, including unexpected behavior within Audius and related products.',
  keepItSecret: 'Keep it secret. Keep it safe.',
  yourPrivateKey:
    'Your private key should be kept confidential and stored securely.',
  audiusWillNever: 'Audius will NEVER request your private key.',
  avoidPhishing:
    'Avoid phishing attempts and never enter your private key on suspicious websites.',
  needHelp: 'Need Help?',
  featureIntended:
    'This feature is intended for use by advanced users only. If you have questions or need assistance, please reach out to',
  support: 'Audius support.',
  agree: 'Agree and Continue',
  iUnderstand:
    'I understand the risks associated with extracting my private key.',
  iAccept: 'I accept full responsibility for its security and use.',
  iAcknowledge:
    'I acknowledge Audius is not liable for any damages or losses that may arise from the use of this tool.',
  goBack: 'Go Back',
  proceed: 'I Understand The Risks'
}

const BackToSettings = () => {
  const { color } = useTheme()
  return (
    <Flex alignItems='center' gap='s' pt='xl'>
      <IconCaretLeft size='m' fill={color.neutral.n800} />
      <Text variant='title'>{messages.backToSettings}</Text>
    </Flex>
  )
}

const ShowPrivateKey = () => {
  return (
    <Flex direction='column' alignItems='flex-start' mv='l' pv='xl' gap='l'>
      <Text variant='heading' css={{ fontSize: 34 }} color='accent'>
        {messages.showPrivateKey}
      </Text>
      <Flex gap='s'>
        <IconTriangleExclamation />
        <Text variant='body' color='danger' size='l' strength='strong'>
          {messages.yourOwnRisk}
        </Text>
      </Flex>
    </Flex>
  )
}

const WhatDoesThisDo = () => {
  const { color } = useTheme()
  return (
    <Flex direction='column' alignItems='flex-start' mv='l' pv='xl' gap='l'>
      <Flex alignItems='center' gap='s'>
        <IconQuestionCircle size='m' fill={color.neutral.n800} />
        <Text variant='title' css={{ fontSize: 24 }}>
          {messages.what}
        </Text>
      </Flex>
      <Text variant='body' textAlign='left'>
        {messages.thisTool}
      </Text>
      <Text variant='body' textAlign='left'>
        {messages.advancedUsers}
      </Text>
      <Text variant='body' textAlign='left' strength='strong'>
        {messages.note}
      </Text>
    </Flex>
  )
}

const UnderstandTheRisks = () => {
  const { color } = useTheme()
  const bulletPoints = [
    messages.untrustworthyParties,
    messages.compromisingSecurity,
    messages.lossOfFunds,
    messages.unforeseenConsequences
  ]
  return (
    <Box pv='xl'>
      <Flex
        direction='column'
        alignItems='flex-start'
        pv='l'
        ph='2xl'
        gap='l'
        borderRadius='m'
        border='strong'
        css={{
          background: 'rgba(208, 2, 27, 0.05)',
          borderColor: color.special.red
        }}
      >
        <Flex alignItems='center' gap='s'>
          <IconTriangleExclamation size='m' />
          <Text variant='title' color='danger' css={{ fontSize: 24 }}>
            {messages.understandTheRisk}
          </Text>
        </Flex>
        <Text variant='body' strength='strong' textAlign='left' color='danger'>
          {messages.improperUse}
        </Text>
        {bulletPoints.map((bulletPoint, i) => (
          <Text
            key={`bullet-point${i}`}
            variant='body'
            textAlign='left'
            color='danger'
            css={{
              display: 'list-item',
              listStyleType: 'disc',
              listStylePosition: 'inside'
            }}
          >
            {bulletPoint}
          </Text>
        ))}
      </Flex>
    </Box>
  )
}

const KeepItSecret = () => {
  const { color } = useTheme()
  const bulletPoints = [
    messages.yourPrivateKey,
    messages.audiusWillNever,
    messages.avoidPhishing
  ]
  return (
    <Flex direction='column' alignItems='flex-start' mv='l' pv='xl' gap='l'>
      <Flex alignItems='center' gap='s'>
        <IconVisibilityHidden size='m' fill={color.neutral.n800} />
        <Text variant='title' css={{ fontSize: 24 }}>
          {messages.keepItSecret}
        </Text>
      </Flex>
      {bulletPoints.map((bulletPoint, i) => (
        <Text
          key={`bullet-point${i}`}
          variant='body'
          textAlign='left'
          css={{
            display: 'list-item',
            listStyleType: 'disc',
            listStylePosition: 'inside'
          }}
        >
          {bulletPoint}
        </Text>
      ))}
    </Flex>
  )
}

const NeedHelp = () => {
  const { color } = useTheme()
  return (
    <Flex direction='column' alignItems='flex-start' mv='l' pv='xl' gap='l'>
      <Flex alignItems='center' gap='s'>
        <IconLifeRing
          size='m'
          fill={color.neutral.n800}
          css={{ fill: 'yellow' }}
        />
        <Text variant='title' css={{ fontSize: 24 }}>
          {messages.needHelp}
        </Text>
      </Flex>
      <Text variant='body' textAlign='left'>
        {messages.featureIntended}&nbsp;
        <TextLink
          target='_blank'
          isExternal
          css={{ color: color.primary.p500 }}
        >
          {messages.support}
        </TextLink>
      </Text>
    </Flex>
  )
}

const AgreeAndContinue = () => {
  const bulletPoints = [
    messages.iUnderstand,
    messages.iAccept,
    messages.iAcknowledge
  ]
  return (
    <Flex direction='column' alignItems='flex-start' mv='l' pv='xl' gap='xl'>
      <Text variant='title' css={{ fontSize: 24 }}>
        {messages.agree}
      </Text>
      <Flex alignItems='flex-start' gap='xl'>
        <Switch />
        <Flex direction='column' gap='s'>
          {bulletPoints.map((bulletPoint, i) => (
            <Text
              key={`bullet-point${i}`}
              variant='body'
              textAlign='left'
              css={{
                display: 'list-item',
                listStyleType: 'disc',
                listStylePosition: 'inside'
              }}
            >
              {bulletPoint}
            </Text>
          ))}
        </Flex>
      </Flex>
      <Flex gap='xl' mt='s'>
        <Button variant='secondary'>{messages.goBack}</Button>
        <Button variant='destructive'>{messages.proceed}</Button>
      </Flex>
    </Flex>
  )
}

export const PrivateKeyExporterPage = () => {
  return (
    <Page>
      <Box
        pv='xl'
        ph='4xl'
        backgroundColor='white'
        border='strong'
        borderRadius='m'
        css={{
          boxShadow:
            '0px 4px 8px 0px rgba(0, 0, 0, 0.06), 0px 0px 4px 0px rgba(0, 0, 0, 0.04)'
        }}
      >
        <BackToSettings />
        <ShowPrivateKey />
        <Divider orientation='horizontal' />
        <WhatDoesThisDo />
        <UnderstandTheRisks />
        <KeepItSecret />
        <Divider orientation='horizontal' />
        <NeedHelp />
        <Divider orientation='horizontal' />
        <AgreeAndContinue />
      </Box>
    </Page>
  )
}
