import { useArtistCoinByTicker } from '@audius/common/api'
import { useCurrentUserId } from '@audius/common/api'
import {
  useEditCoinDetailsFormConfiguration,
  type EditCoinDetailsFormValues
} from '@audius/common/hooks'
import { EDIT_COIN_DETAILS_PAGE } from '@audius/common/src/utils/route'
import { formatTickerFromUrl } from '@audius/common/utils'
import {
  Box,
  Divider,
  Flex,
  IconLink,
  IconPlus,
  IconInstagram,
  IconTikTok,
  IconX,
  LoadingSpinner,
  PlainButton,
  spacing,
  Text,
  TextInput
} from '@audius/harmony'
import { Field, Form, Formik, useFormikContext } from 'formik'
import { ChangeEvent, createContext, useCallback, useRef } from 'react'
import { Redirect, useParams } from 'react-router-dom'

import { AnchoredSubmitRowEdit } from 'components/edit/AnchoredSubmitRowEdit'

// Local scroll context for the coin details form
const EditFormScrollContext = createContext(() => {})

import { Header } from 'components/header/desktop/Header'
import Page from 'components/page/Page'
import { useIsMobile } from 'hooks/useIsMobile'
import { BASE_URL } from 'utils/route'
import { TokenIcon } from 'components/buy-sell-modal/TokenIcon'
import type { Coin } from '~/adapters/coin'
import TextArea from 'components/data-entry/TextArea'

// Helper function to detect platform from URL
const detectPlatform = (
  url: string
): 'x' | 'instagram' | 'tiktok' | 'website' => {
  const cleanUrl = url.toLowerCase().trim()

  if (cleanUrl.includes('twitter.com') || cleanUrl.includes('x.com')) {
    return 'x'
  }
  if (cleanUrl.includes('instagram.com')) {
    return 'instagram'
  }
  if (cleanUrl.includes('tiktok.com')) {
    return 'tiktok'
  }

  // Check for valid URL format (generic website)
  try {
    new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`)
    return 'website'
  } catch {
    return 'website'
  }
}

// Get platform icon
const getPlatformIcon = (platform: string) => {
  switch (platform) {
    case 'x':
      return IconX
    case 'instagram':
      return IconInstagram
    case 'tiktok':
      return IconTikTok
    case 'website':
    default:
      return IconLink
  }
}

const SocialLinksSection = () => {
  const { values, setFieldValue } = useFormikContext<any>()

  const handleAddSocialLink = () => {
    const newLinks = [...values.socialLinks, { platform: 'website', value: '' }]
    setFieldValue('socialLinks', newLinks)
  }

  const handleLinkChange = (
    index: number,
    value: ChangeEvent<HTMLInputElement> | string
  ) => {
    const newValue = typeof value === 'string' ? value : value.target.value
    const detectedPlatform = detectPlatform(newValue)

    const newLinks = [...values.socialLinks]
    newLinks[index] = {
      platform: detectedPlatform,
      value: newValue
    }
    setFieldValue('socialLinks', newLinks)
  }

  return (
    <Flex column gap='l' m='xl'>
      <Flex alignItems='center' gap='s'>
        <Text variant='title' size='l'>
          {messages.socialLinks}
        </Text>
        <Text variant='body' size='m' color='subdued'>
          {messages.optional}
        </Text>
      </Flex>

      <Flex column gap='m'>
        {values.socialLinks.map((link: any, index: number) => (
          <TextInput
            label={`${link.platform.charAt(0).toUpperCase() + link.platform.slice(1)} ${messages.socialLink}`}
            placeholder={messages.pasteLink}
            value={link.value}
            onChange={(value) => handleLinkChange(index, value)}
            startIcon={getPlatformIcon(link.platform) ?? IconLink}
          />
        ))}

        {/* Add new link button */}
        {values.socialLinks.length < 4 && (
          <PlainButton
            size='large'
            onClick={handleAddSocialLink}
            iconLeft={IconPlus}
          >
            {messages.addAnotherLink}
          </PlainButton>
        )}
      </Flex>
    </Flex>
  )
}

const messages = {
  editCoinPage: 'Edit Coin Page',
  tokenDetails: 'Token Details',
  description: 'Description',
  socialLinks: 'Social Links',
  socialLink: 'Link',
  addAnotherLink: 'Add another link',
  saveChanges: 'Save Changes',
  optional: '(Optional)',
  descriptionPlaceholder:
    'Tell fans what makes your artist coin special — think early listens, exclusive drops, or fun perks for your biggest supporters.',
  pasteLink: 'Paste a link'
}

const DesktopEditCoinDetailsPageContent = ({ coin }: { coin?: Coin }) => {
  if (!coin) return null
  const { data: userId } = useCurrentUserId()

  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const handleSubmit = async (values: any) => {
    // Transform social links array to individual fields for API
    const transformedValues = {
      description: values.description,
      ...values.socialLinks.reduce((acc: any, link: any) => {
        switch (link.platform) {
          case 'x':
            acc.xHandle = link.value
            break
          case 'instagram':
            acc.instagramHandle = link.value
            break
          case 'tiktok':
            acc.tiktokHandle = link.value
            break
          case 'website':
            acc.website = link.value
            break
        }
        return acc
      }, {})
    }

    console.log('Submitting coin update:', {
      mint: coin.mint,
      userId,
      originalValues: values,
      transformedValues
    })
    // TODO: Implement actual API call to update coin
    // For now, just simulate a delay
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const formConfiguration = useEditCoinDetailsFormConfiguration(handleSubmit)

  const initialValues: EditCoinDetailsFormValues = {
    description: coin.description || '',
    socialLinks: [{ platform: 'website', value: '' }] // Start with one empty social link
  }

  const header = (
    <Header primary={messages.editCoinPage} showBackButton={true} />
  )

  return (
    <Page title={messages.editCoinPage} header={header}>
      <Formik {...formConfiguration} initialValues={initialValues}>
        {({ isSubmitting }) => (
          <Form>
            <EditFormScrollContext.Provider value={scrollToTop}>
              <div ref={scrollRef}>
                <Box backgroundColor='white' borderRadius='m' border='default'>
                  {/* Token Details Section */}
                  <Flex gap='s' m='xl'>
                    <TokenIcon
                      logoURI={coin?.logoUri}
                      w={spacing['4xl']}
                      h={spacing['4xl']}
                      hex
                    />
                    <Flex column justifyContent='center'>
                      <Text variant='heading' size='s'>
                        {coin?.name}
                      </Text>
                      <Text variant='title' size='l' color='subdued'>
                        {coin?.ticker}
                      </Text>
                    </Flex>
                  </Flex>

                  {/* Divider */}
                  <Divider />

                  {/* Description Section */}
                  <Flex column gap='l' m='xl'>
                    <Text variant='title' size='l'>
                      {messages.description}
                    </Text>

                    <Field name='description'>
                      {({ field, meta }: any) => (
                        <TextArea
                          {...field}
                          placeholder={messages.descriptionPlaceholder}
                          characterLimit={2500}
                          error={meta.touched && meta.error}
                        />
                      )}
                    </Field>
                  </Flex>

                  {/* Divider */}
                  <Divider />

                  {/* Social Links Section */}
                  <SocialLinksSection />
                </Box>
              </div>
              <AnchoredSubmitRowEdit />
            </EditFormScrollContext.Provider>
          </Form>
        )}
      </Formik>
    </Page>
  )
}

export const EditCoinDetailsPage = () => {
  const { ticker } = useParams<{ ticker: string }>()

  const {
    data: coin,
    isPending,
    isSuccess,
    error: coinError
  } = useArtistCoinByTicker({ ticker: formatTickerFromUrl(ticker) })

  if (!ticker) {
    return <Redirect to='/wallet' />
  }

  if (isPending) {
    return (
      <Flex
        justifyContent='center'
        alignItems='center'
        css={{ minHeight: '100vh' }}
      >
        <LoadingSpinner />
      </Flex>
    )
  }

  if (coinError || (isSuccess && !coin)) {
    return <Redirect to='/wallet' />
  }

  return <DesktopEditCoinDetailsPageContent coin={coin ?? undefined} />
}
