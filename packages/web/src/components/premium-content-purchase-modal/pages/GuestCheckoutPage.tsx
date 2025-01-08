import { useCallback } from 'react'

import { GUEST_EMAIL } from '@audius/common/src/hooks/purchaseContent/constants'
import { PurchaseableContentMetadata } from '@audius/common/src/hooks/purchaseContent/types'
import { isPurchaseableAlbum } from '@audius/common/src/hooks/purchaseContent/utils'
import { messages as validationMessages } from '@audius/common/src/hooks/purchaseContent/validation'
import { SIGN_IN_PAGE, SIGN_UP_PAGE } from '@audius/common/src/utils/route'
import { USDC } from '@audius/fixed-decimal'
import { Button, Flex, Hint, Text } from '@audius/harmony'
import { useField } from 'formik'
import { useDispatch } from 'react-redux'

import { setValueField } from 'common/store/pages/signon/actions'
import { TextLink } from 'components/link'
import { PurchaseSummaryTable } from 'components/premium-content-purchase-modal/components/PurchaseSummaryTable'
import { usePurchaseContentFormState } from 'components/premium-content-purchase-modal/hooks/usePurchaseContentFormState'
import { LockedContentDetailsTile } from 'components/track/LockedContentDetailsTile'
import { useIsMobile } from 'hooks/useIsMobile'
import { EmailField } from 'pages/sign-up-page/components/EmailField'
const messages = {
  continueAsGuest: 'Continue as Guest',
  signIn: 'Sign in.',
  alreadyHaveAnAccount: 'Already have an account?',
  orContinueGuest: 'Or, continue as a guest.',
  finishSigningUp: 'Finish Signing Up'
}

type GuestCheckoutProps = {
  metadata: PurchaseableContentMetadata
  price: number
  onClickSignIn: () => void
}

export const GuestCheckoutPage = (props: GuestCheckoutProps) => {
  const { metadata, price, onClickSignIn } = props
  const dispatch = useDispatch()

  const { purchaseSummaryValues } = usePurchaseContentFormState({
    price
  })
  const isMobile = useIsMobile()
  const [{ value: email }, { error }] = useField(GUEST_EMAIL)
  const isAlbumPurchase = isPurchaseableAlbum(metadata)
  const stemsPurchaseCount =
    'is_download_gated' in metadata && metadata.is_download_gated
      ? (metadata._stems?.length ?? 0)
      : 0
  const downloadPurchaseCount =
    'is_download_gated' in metadata &&
    metadata.is_download_gated &&
    metadata.is_downloadable
      ? 1
      : 0
  const streamPurchaseCount = metadata.is_stream_gated ? 1 : 0
  const handleClickConfirmEmail = useCallback(() => {
    dispatch(setValueField('email', email))
  }, [dispatch, email])

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

          <EmailField name={GUEST_EMAIL} helperText={''} />
          {error ? (
            <Hint>
              {error}{' '}
              {error === validationMessages.guestAccountExists ? (
                <TextLink
                  to={SIGN_UP_PAGE}
                  variant='visible'
                  asChild
                  onClick={handleClickConfirmEmail}
                >
                  {messages.finishSigningUp}
                </TextLink>
              ) : null}
            </Hint>
          ) : null}
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
