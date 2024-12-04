import { GUEST_EMAIL } from '@audius/common/src/hooks/purchaseContent/constants'
import { PurchaseableContentMetadata } from '@audius/common/src/hooks/purchaseContent/types'
import { isPurchaseableAlbum } from '@audius/common/src/hooks/purchaseContent/utils'
import { SIGN_IN_PAGE } from '@audius/common/src/utils/route'
import { USDC } from '@audius/fixed-decimal'
import { Button, Flex, Text } from '@audius/harmony'

import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
import { TextLink } from 'components/link'
import { PurchaseSummaryTable } from 'components/premium-content-purchase-modal/components/PurchaseSummaryTable'
import { usePurchaseContentFormState } from 'components/premium-content-purchase-modal/hooks/usePurchaseContentFormState'
import { LockedContentDetailsTile } from 'components/track/LockedContentDetailsTile'
import { useIsMobile } from 'hooks/useIsMobile'

const messages = {
  continueAsGuest: 'Continue as Guest',
  signIn: 'Sign in.',
  alreadyHaveAnAccount: 'Already have an account?',
  orContinueGuest: 'Or, continue as a guest.',
  yourEmail: 'Your Email'
}

type GuestCheckoutProps = {
  metadata: PurchaseableContentMetadata
  price: number
  onClickSignIn: () => void
}

export const GuestCheckoutPage = (props: GuestCheckoutProps) => {
  const { metadata, price, onClickSignIn } = props
  const { purchaseSummaryValues } = usePurchaseContentFormState({
    price
  })
  const isMobile = useIsMobile()

  const isAlbumPurchase = isPurchaseableAlbum(metadata)
  const stemsPurchaseCount =
    'is_download_gated' in metadata && metadata.is_download_gated
      ? metadata._stems?.length ?? 0
      : 0
  const downloadPurchaseCount =
    'is_download_gated' in metadata &&
    metadata.is_download_gated &&
    metadata.is_downloadable
      ? 1
      : 0
  const streamPurchaseCount = metadata.is_stream_gated ? 1 : 0

  return (
    <Flex
      p={isMobile ? 'l' : 'xl'}
      direction='column'
      pb='m'
      justifyContent='space-between'
    >
      <Flex direction='column' gap='xl' w='100%'>
        <LockedContentDetailsTile
          showLabel={false}
          metadata={metadata}
          owner={metadata.user}
          earnAmount={USDC(price / 100)
            .round()
            .toShorthand()}
        />
        <PurchaseSummaryTable
          {...purchaseSummaryValues}
          stemsPurchaseCount={stemsPurchaseCount}
          downloadPurchaseCount={downloadPurchaseCount}
          streamPurchaseCount={streamPurchaseCount}
          totalPriceInCents={price}
          isAlbumPurchase={isAlbumPurchase}
        />
        <Flex
          direction='column'
          border='default'
          borderRadius='s'
          p='l'
          gap='l'
        >
          <Text variant='body' strength='strong'>
            {messages.alreadyHaveAnAccount}{' '}
            <TextLink
              to={SIGN_IN_PAGE}
              variant='visible'
              onClick={onClickSignIn}
            >
              {messages.signIn}
            </TextLink>{' '}
            {messages.orContinueGuest}
          </Text>

          <HarmonyTextField name={GUEST_EMAIL} label={messages.yourEmail} />
        </Flex>
      </Flex>
    </Flex>
  )
}

export const GuestCheckoutFooter = () => {
  return (
    <Button fullWidth type='submit'>
      {messages.continueAsGuest}
    </Button>
  )
}
