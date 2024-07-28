import { useCallback, useMemo, useState, useEffect } from 'react'

import { useAudiusQueryContext } from '@audius/common/audius-query'
import { createEmailPageMessages } from '@audius/common/messages'
import { emailSchema } from '@audius/common/schemas'
import {
  Box,
  Button,
  Divider,
  Flex,
  IconArrowRight,
  IconAudiusLogoHorizontalColor,
  IconMetamask,
  Text,
  TextLink
} from '@audius/harmony'
import { Formik } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { useWindowSize } from 'react-use'
import { toFormikValidationSchema } from 'zod-formik-adapter'
import { Web3Auth } from "@web3auth/modal"
import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base"
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider"
import Web3 from "web3"

import audiusLogoColored from 'assets/img/audiusLogoColored.png'
import {
  configureWeb3Auth,
  resetSignOn,
  setLinkedSocialOnFirstPage,
  setValueField,
  startSignUp
} from 'common/store/pages/signon/actions'
import {
  getEmailField,
  getLinkedSocialOnFirstPage
} from 'common/store/pages/signon/selectors'
import PreloadImage from 'components/preload-image/PreloadImage'
import { useMedia } from 'hooks/useMedia'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { SocialMediaLoginOptions } from 'pages/sign-up-page/components/SocialMediaLoginOptions'
import {
  SIGN_IN_PAGE,
  SIGN_UP_CREATE_LOGIN_DETAILS,
  SIGN_UP_HANDLE_PAGE,
  SIGN_UP_PASSWORD_PAGE,
  SIGN_UP_REVIEW_HANDLE_PAGE
} from 'utils/route'

import ConnectedMetaMaskModal from '../components/ConnectedMetaMaskModal'
import { NewEmailField } from '../components/EmailField'
import { SocialMediaLoading } from '../components/SocialMediaLoading'
import { Heading, Page } from '../components/layout'
import { useSocialMediaLoader } from '../hooks/useSocialMediaLoader'

const smallDesktopWindowHeight = 900

export type SignUpEmailValues = {
  email: string
  withMetaMask?: boolean
  withWeb3Auth?: boolean
}

const clientId = ""

const acdcChainConfig = {
  chainId: "0x102021",
  rpcTarget: "https://discoveryprovider.staging.audius.co/chain",
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  displayName: "ACDC Testnet",
  blockExplorerUrl: "https://healthz.audius.co/#/stage/explorer",
  ticker: "ETH",
  tickerName: "Ethereum",
  logo: "https://cdn.iconscout.com/icon/free/png-256/free-lightning-120-453014.png"
}

const ganacheChainConfig = {
  chainId: "0xE8D4A51001",
  rpcTarget: "http://audius-protocol-poa-ganache-1:8545",
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  displayName: "ACDC Local",
  blockExplorerUrl: "https://healthz.audius.co/#/stage/explorer",
  ticker: "ETH",
  tickerName: "Ethereum",
  logo: "https://cdn.iconscout.com/icon/free/png-256/free-lightning-120-453014.png"
}

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig: ganacheChainConfig },
});

const web3auth = new Web3Auth({
  clientId,
  chainConfig: ganacheChainConfig,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  privateKeyProvider: privateKeyProvider,
  uiConfig: {
    loginMethodsOrder: ["google", "github", "warpcast"]
  }
});

export const CreateEmailPage = () => {
  const { isMobile } = useMedia()
  const { height: windowHeight } = useWindowSize()
  const isSmallDesktop = windowHeight < smallDesktopWindowHeight
  const dispatch = useDispatch()
  const navigate = useNavigateToPage()
  const [isMetaMaskModalOpen, setIsMetaMaskModalOpen] = useState(false)
  const existingEmailValue = useSelector(getEmailField)
  const alreadyLinkedSocial = useSelector(getLinkedSocialOnFirstPage)
  const audiusQueryContext = useAudiusQueryContext()
  const EmailSchema = useMemo(
    () => toFormikValidationSchema(emailSchema(audiusQueryContext)),
    [audiusQueryContext]
  )

  /** web3auth hooks */
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  const initialValues = {
    email: existingEmailValue.value ?? ''
  }

  const {
    isWaitingForSocialLogin,
    handleStartSocialMediaLogin,
    handleErrorSocialMediaLogin
  } = useSocialMediaLoader({
    resetAction: resetSignOn,
    linkedSocialOnThisPagePreviously: alreadyLinkedSocial,
    page: 'create-email'
  })

  const handleCompleteSocialMediaLogin = useCallback(
    (result: { requiresReview: boolean; handle: string }) => {
      const { handle, requiresReview } = result
      dispatch(startSignUp())
      dispatch(setLinkedSocialOnFirstPage(true))
      dispatch(setValueField('handle', handle))
      navigate(
        requiresReview
          ? SIGN_UP_REVIEW_HANDLE_PAGE
          : SIGN_UP_CREATE_LOGIN_DETAILS
      )
    },
    [dispatch, navigate]
  )

  const handleSubmit = useCallback(
    async (values: SignUpEmailValues) => {
      const { email, withMetaMask, withWeb3Auth } = values
      dispatch(setValueField('email', email))
      console.log({ email, withMetaMask, withWeb3Auth })
      if (withMetaMask) {
        setIsMetaMaskModalOpen(true)
        return
      } 
      if (withWeb3Auth) {
        const web3authProvider = await web3auth.connect()
        const authWeb3 = new Web3(web3authProvider as any)
        console.log({ netId: await authWeb3.eth.net.getId() })

        // @ts-ignore
        window.web3authProvider = authWeb3
        // @ts-ignore
        window.web3auth = web3auth

        console.log({ netId: await authWeb3.eth.net.getId() })

        dispatch(configureWeb3Auth())
        navigate(SIGN_UP_HANDLE_PAGE)
        return
      }
      navigate(SIGN_UP_PASSWORD_PAGE)
    },
    [dispatch, navigate]
  )

  const signInLink = (
    <TextLink variant='visible' asChild>
      <Link to={SIGN_IN_PAGE}>{createEmailPageMessages.signIn}</Link>
    </TextLink>
  )

  useEffect(() => {
    const init = async () => {
      try {
        // IMP START - SDK Initialization
        await web3auth.initModal();
        // IMP END - SDK Initialization
        setProvider(web3auth.provider);

        if (web3auth.connected) {
          setLoggedIn(true);
        }
      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, []);

  return isWaitingForSocialLogin ? (
    <SocialMediaLoading />
  ) : (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={EmailSchema}
      validateOnChange={false}
    >
      {({ isSubmitting, setFieldValue, submitForm }) => (
        <Page pt={isMobile ? 'xl' : 'unit13'}>
          <Box alignSelf={isSmallDesktop ? 'flex-start' : 'center'}>
            {isMobile || isSmallDesktop ? (
              <IconAudiusLogoHorizontalColor />
            ) : (
              <PreloadImage
                src={audiusLogoColored}
                alt='Audius Colored Logo'
                css={{
                  height: 160,
                  width: 160,
                  objectFit: 'contain'
                }}
              />
            )}
          </Box>
          <Heading
            heading={createEmailPageMessages.title}
            tag='h1'
            centered={isMobile}
          />
          <Flex direction='column' gap='l'>
            <NewEmailField />
            <Divider>
              <Text variant='body' size={isMobile ? 's' : 'm'} color='subdued'>
                {createEmailPageMessages.socialsDividerText}
              </Text>
            </Divider>
            <SocialMediaLoginOptions
              onError={handleErrorSocialMediaLogin}
              onStart={handleStartSocialMediaLogin}
              onCompleteSocialMediaLogin={handleCompleteSocialMediaLogin}
            />
          </Flex>
          <Flex direction='column' gap='l'>
            <Button
              variant='primary'
              type='submit'
              fullWidth
              iconRight={IconArrowRight}
              isLoading={isSubmitting}
              onClick={() => {
                setFieldValue('withMetaMask', false)
                submitForm()
              }}
            >
              {createEmailPageMessages.signUp}
            </Button>

            <Text
              variant='body'
              size={isMobile ? 'm' : 'l'}
              textAlign={isMobile ? 'center' : undefined}
            >
              {createEmailPageMessages.haveAccount} {signInLink}
            </Text>
          </Flex>
          {/** Web3Auth */}
          {!isMobile ? (
            <Flex direction='column' gap='s'>
              <Button
                variant='secondary'
                isStaticIcon
                fullWidth
                type='submit'
                onClick={() => {
                  setFieldValue('withWeb3Auth', true)
                  setFieldValue('withMetaMask', false)
                  submitForm()
                }}
              >
                {createEmailPageMessages.signUpWeb3Auth}
              </Button>
            </Flex>
          ) : null}
          {!isMobile && window.ethereum ? (
            <Flex direction='column' gap='s'>
              <Button
                variant='secondary'
                iconRight={IconMetamask}
                isStaticIcon
                fullWidth
                type='submit'
                onClick={() => {
                  setFieldValue('withMetaMask', true)
                  submitForm()
                }}
              >
                {createEmailPageMessages.signUpMetamask}
              </Button>
              <ConnectedMetaMaskModal
                open={isMetaMaskModalOpen}
                onBack={() => setIsMetaMaskModalOpen(false)}
                onSuccess={() => {
                  console.log("here?")
                  navigate(SIGN_UP_HANDLE_PAGE)
                }}
              />
              <Text size='s' variant='body'>
                {createEmailPageMessages.metaMaskNotRecommended}{' '}
                <TextLink variant='visible'>
                  {createEmailPageMessages.learnMore}
                </TextLink>
              </Text>
            </Flex>
          ) : null}
        </Page>
      )}
    </Formik>
  )
}
