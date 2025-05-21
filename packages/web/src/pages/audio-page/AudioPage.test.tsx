import { SquareSizes, ID, User, Wallet, Transaction, BNWei, StringWei, SolanaWalletAddress, EthereumWalletAddress } from '@audius/common/models'
import { accountSelectors, walletSelectors, uiActions as coreUIActions, chatActions, cacheUsersSelectors, audioRewardsPageActions, walletActions } from '@audius/common/store'
import { AudiusBackend, apiClient } from '@audius/common/services'
import { BN, formatWei, removeNullable } from '@audius/common/utils'
import { Text, Button, IconReceive, IconSend, IconCart, IconTrending, IconTokenAudius } from '@audius/harmony'
import { developmentConfig } from '@audius/sdk'
import { http, HttpResponse, passthrough } from 'msw'
import { setupServer } from 'msw/node'
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom-v5-compat'
import { describe, it, expect, vi, beforeAll, afterEach, afterAll, beforeEach } from 'vitest'

import { render, screen, testStore, waitFor, userEvent, within as rtlWithin } from 'test/test-utils'
import { AUDIO_PAGE } from 'utils/route'

import { AudioPage } from './AudioPage' // Adjust path if necessary

// Mock common store selectors and actions
vi.mock('@audius/common/store', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    accountSelectors: {
      ...actual.accountSelectors,
      getAccountUser: vi.fn(),
      getUserId: vi.fn(),
      getAccountStatus: vi.fn(),
      getUserHandle: vi.fn()
    },
    walletSelectors: {
        ...actual.walletSelectors,
        getBalance: vi.fn(),
        getTransactions: vi.fn(),
        getAssociatedWallets: vi.fn(),
        getLocalBalanceDidChange: vi.fn().mockReturnValue(false),
        getAccountTotalBalance: vi.fn(),
        getClaimableRewards: vi.fn().mockReturnValue({ hasRewards: false, totalClaimableWei: new BN(0) }),
        getClaimStatus: vi.fn().mockReturnValue('idle')
    },
    cacheUsersSelectors: {
        ...actual.cacheUsersSelectors,
        getUser: vi.fn(),
        getUsers: vi.fn().mockReturnValue({})
    },
    uiActions: { 
        ...actual.uiActions,
        showModal: vi.fn(),
        hideModal: vi.fn(),
        setLoading: vi.fn(),
        openSignOn: vi.fn() 
    },
    audioRewardsPageActions: {
        ...actual.audioRewardsPageActions,
        fetchClaimableRewards: vi.fn(),
        claimAllRewards: vi.fn()
    },
    walletActions: {
        ...actual.walletActions,
        sendWAudio: vi.fn(),
        fetchWalletHistory: vi.fn(),
        resetSend: vi.fn(),
        setWalletAddress: vi.fn()
    }
  }
})
vi.mock('@audius/common/services', async (importOriginal) => {
    const actual = await importOriginal()
    return {
        ...actual,
        apiClient: {
            getRecentTransactions: vi.fn(),
            getAudioTransactionHistory: vi.fn(),
            sendWAudio: vi.fn(), // Mock sendWAudio
            getHandleFromWallet: vi.fn(), // Mock for resolving wallet addresses
        },
        AudiusBackend: {
            getAssociatedWallets: vi.fn(),
            getUSDCUserBank: vi.fn(),
            getAudioTransactions: vi.fn(),
            getSolanaConnection: vi.fn().mockReturnValue({
                getTokenAccountBalance: vi.fn().mockResolvedValue({ uiAmount: 100 }) // Mock Solana connection
            }),
        }
    }
})


const { apiEndpoint } = developmentConfig.network
const currentUserId = 123 as ID
const recipientUserId = 456 as ID
const recipientUserHandle = 'recipientUser'
const recipientUserWallet = 'recipientSolanaAddress' as SolanaWalletAddress

const mockUserWallet: Wallet = {
  balance: new BN('10000000000') as BNWei, // 100 $AUDIO (100 * 10^8)
  total_balance: new BN('12000000000') as BNWei,
  associated_wallets_balance: new BN('2000000000') as BNWei,
  associated_sol_wallets_balance: new BN('0') as BNWei,
  tracked_token_balances: {},
  local_balance_did_change: false,
}

const mockCurrentUser: User = {
    user_id: currentUserId,
    handle: 'testUser',
    name: 'Test User',
    wallet: 'userSolanaAddress' as SolanaWalletAddress,
    is_deactivated: false, is_verified: false, blocknumber: 1, created_at: '', updated_at: '', cover_photo: null, profile_picture: null, album_count: 0, followee_count: 0, follower_count: 0, playlist_count: 0, repost_count: 0, track_count: 0, cover_photo_sizes: null, profile_picture_sizes: null, metadata_multihash: null, erc_wallet: 'userEthAddress' as EthereumWalletAddress, spl_wallet: 'userSolanaAddress' as SolanaWalletAddress, associated_wallets: { sol: ['userSolanaAddress' as SolanaWalletAddress], eth: ['userEthAddress' as EthereumWalletAddress]}
}

const mockRecipientUser: User = {
    user_id: recipientUserId,
    handle: recipientUserHandle,
    name: 'Recipient User',
    wallet: recipientUserWallet,
    is_deactivated: false, is_verified: false, blocknumber: 1, created_at: '', updated_at: '', cover_photo: null, profile_picture: null, album_count: 0, followee_count: 0, follower_count: 0, playlist_count: 0, repost_count: 0, track_count: 0, cover_photo_sizes: null, profile_picture_sizes: null, metadata_multihash: null, erc_wallet: 'recipientEthAddress' as EthereumWalletAddress, spl_wallet: recipientUserWallet,
}

const mockTransactionsArray: Transaction[] = [
  { transaction_type: 'user_reward', method: 'claim', signature: 'sig1', transaction_date: new Date('2023-03-15T10:00:00Z').toISOString(), change: new BN('500000000') as BNWei, balance: new BN('10500000000') as BNWei, metadata: { slot: 1 } },
  { transaction_type: 'transfer', method: 'send', signature: 'sig2', transaction_date: new Date('2023-03-14T12:00:00Z').toISOString(), change: new BN('-200000000') as BNWei, balance: new BN('10300000000') as BNWei, metadata: { user_id: recipientUserId, name: 'Recipient User', handle: recipientUserHandle } },
  { transaction_type: 'transfer', method: 'receive', signature: 'sig4', transaction_date: new Date('2023-03-12T10:00:00Z').toISOString(), change: new BN('300000000') as BNWei, balance: new BN('10600000000') as BNWei, metadata: { user_id: 789, name: 'Sender User', handle: 'senderUser' } },
  { transaction_type: 'purchase_stripe', method: 'purchase_track', signature: 'sig3', transaction_date: new Date('2023-03-13T14:00:00Z').toISOString(), change: new BN('-100000000') as BNWei, balance: new BN('10200000000') as BNWei, metadata: { content_id: 'track789', content_title: 'Cool Song' } },
  { transaction_type: 'track_premium_sale', method: 'sale', signature: 'sig5', transaction_date: new Date('2023-03-11T10:00:00Z').toISOString(), change: new BN('100000000') as BNWei, balance: new BN('10700000000') as BNWei, metadata: { content_id: 'trackOwned', content_title: 'My Hit Song', user_id: 999, name: 'Buyer User', handle: 'buyerUser' } },
]

let allTransactions = [...mockTransactionsArray]; // To simulate pagination

const server = setupServer(
  http.get(`${apiEndpoint}/v1/users/${currentUserId}`, () => HttpResponse.json({ data: mockCurrentUser })),
  http.get(`${apiEndpoint}/v1/users/${recipientUserId}`, () => HttpResponse.json({ data: mockRecipientUser })),
  http.get(`${apiEndpoint}/v1/users/${currentUserId}/transactions`, ({request}) => {
    const url = new URL(request.url)
    const offset = parseInt(url.searchParams.get('offset') || '0', 10)
    const limit = parseInt(url.searchParams.get('limit') || '10', 10)
    const paginatedData = allTransactions.slice(offset, offset + limit)
    return HttpResponse.json({ data: paginatedData, count: paginatedData.length, total: allTransactions.length })
  }),
  http.get(`${apiEndpoint}/v1/payment_history`, () => HttpResponse.json({ data: mockTransactionsArray })), // Keep for initial load if separate
  // Mock for sending $AUDIO (this is a placeholder, actual endpoint may vary)
  http.post(`${apiEndpoint}/v1/wallets/send_audio`, async ({ request }) => {
    const body = await request.json() as any
    if (body.recipient === 'errorWalletAddress') {
        return new HttpResponse(JSON.stringify({ error: 'Transaction failed' }), { status: 500 })
    }
    // Simulate successful transaction
    const newTx: Transaction = {
        transaction_type: 'transfer', method: 'send', signature: `sigSuccess${Date.now()}`,
        transaction_date: new Date().toISOString(),
        change: new BN(body.amount).neg(), // amount is in wei
        balance: mockUserWallet.balance.sub(new BN(body.amount)), // Update balance
        metadata: { user_id: recipientUserId, name: 'Recipient User', handle: recipientUserHandle }
    }
    allTransactions.unshift(newTx) // Add to start of history
    mockUserWallet.balance = newTx.balance; // Update wallet balance
    return HttpResponse.json({ data: { signature: newTx.signature } })
  }),
  http.get(`${apiEndpoint}/users/handle_from_wallet`, ({request}) => {
    const url = new URL(request.url)
    const wallet = url.searchParams.get('walletAddress')
    if (wallet === recipientUserWallet) {
      return HttpResponse.json({ data: mockRecipientUser })
    }
    return HttpResponse.json({data: null}, {status: 404})
  }),
  http.get('*', () => passthrough())
)

const renderAudioPage = (loggedInUserId: ID | null = currentUserId, initialTransactions = mockTransactionsArray) => {
  allTransactions = [...initialTransactions]; // Reset for pagination tests
  // @ts-ignore
  accountSelectors.getUserId.mockReturnValue(loggedInUserId)
  // @ts-ignore
  accountSelectors.getUserHandle.mockReturnValue(loggedInUserId ? mockCurrentUser.handle : null)
  // @ts-ignore
  accountSelectors.getAccountUser.mockReturnValue(loggedInUserId ? mockCurrentUser : null)
  // @ts-ignore
  accountSelectors.getAccountStatus.mockReturnValue(loggedInUserId ? 'success' : 'idle')
  // @ts-ignore
  walletSelectors.getBalance.mockReturnValue(mockUserWallet.balance)
  // @ts-ignore
  walletSelectors.getAccountTotalBalance.mockReturnValue(mockUserWallet.total_balance)
  // @ts-ignore
  walletSelectors.getAssociatedWallets.mockReturnValue(mockCurrentUser.associated_wallets)
  // @ts-ignore
  walletSelectors.getTransactions.mockReturnValue(allTransactions) // Use allTransactions for initial state
  // @ts-ignore
  cacheUsersSelectors.getUser.mockImplementation((state, { id }) => {
    if (id === recipientUserId) return mockRecipientUser
    return null
  })
  // @ts-ignore
  AudiusBackend.getAssociatedWallets.mockResolvedValue({ eth: ['userEthAddress' as EthereumWalletAddress], sol: ['userSolanaAddress' as SolanaWalletAddress] })
  // @ts-ignore
  AudiusBackend.getAudioTransactions.mockImplementation(async ({ offset, limit }) => {
    const paginatedData = allTransactions.slice(offset, offset + limit)
    return { data: paginatedData, count: paginatedData.length, total: allTransactions.length }
  })
  // @ts-ignore
  apiClient.getAudioTransactionHistory.mockResolvedValue(allTransactions)
  // @ts-ignore
  apiClient.getHandleFromWallet.mockImplementation(async ({ walletAddress }) => {
    if (walletAddress === recipientUserWallet) return { data: mockRecipientUser }
    return { data: null }
  })


  const store = testStore()

  return render(
    <MemoryRouter initialEntries={[AUDIO_PAGE]}>
      <Routes>
        <Route path={AUDIO_PAGE} element={<AudioPage />} />
      </Routes>
    </MemoryRouter>,
    { store }
  )
}

describe('AudioPage', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterEach(() => { server.resetHandlers(); vi.clearAllMocks(); mockUserWallet.balance = new BN('10000000000'); }) // Reset balance
  afterAll(() => server.close())

  describe('Authenticated User', () => {
    // Basic rendering tests (from previous subtask)
    describe('Basic Rendering', () => {
        beforeEach(() => { renderAudioPage(currentUserId) })
        it('displays the correct $AUDIO balance', async () => {
            expect(await screen.findByText('100.00')).toBeInTheDocument()
            expect(await screen.findByText(/\$AUDIO/)).toBeInTheDocument()
        })
        it('renders Send and Receive action buttons', async () => {
            expect(await screen.findByRole('button', { name: /send \$audio/i })).toBeInTheDocument()
            expect(await screen.findByRole('button', { name: /receive \$audio/i })).toBeInTheDocument()
        })
    })

    describe('Detailed Transaction History Rendering', () => {
        const detailedTransactions: Transaction[] = [
            { transaction_type: 'transfer', method: 'send', signature: 'sigSend', transaction_date: new Date('2023-03-16T10:00:00Z').toISOString(), change: new BN('-100000000') as BNWei, balance: new BN('9900000000') as BNWei, metadata: { user_id: recipientUserId, name: 'Recipient User', handle: recipientUserHandle } },
            { transaction_type: 'transfer', method: 'receive', signature: 'sigReceive', transaction_date: new Date('2023-03-15T10:00:00Z').toISOString(), change: new BN('200000000') as BNWei, balance: new BN('10100000000') as BNWei, metadata: { user_id: 789, name: 'Sender User', handle: 'senderUser' } },
            { transaction_type: 'user_reward', method: 'claim', signature: 'sigReward', transaction_date: new Date('2023-03-14T10:00:00Z').toISOString(), change: new BN('50000000') as BNWei, balance: new BN('10150000000') as BNWei, metadata: { slot: 1 } },
            { transaction_type: 'purchase_stripe', method: 'purchase_track', signature: 'sigPurchase', transaction_date: new Date('2023-03-13T10:00:00Z').toISOString(), change: new BN('-50000000') as BNWei, balance: new BN('10100000000') as BNWei, metadata: { content_id: 'track123', content_title: 'Epic Song' } },
            { transaction_type: 'track_premium_sale', method: 'sale', signature: 'sigSale', transaction_date: new Date('2023-03-12T10:00:00Z').toISOString(), change: new BN('20000000') as BNWei, balance: new BN('10120000000') as BNWei, metadata: { content_id: 'track456', content_title: 'My Hit Track', user_id: 999, name: 'Fan Buyer', handle: 'fanbuyer' } },
        ];
        
        beforeEach(() => {
            renderAudioPage(currentUserId, detailedTransactions);
        });

        it.each(detailedTransactions)('renders $transaction_type transaction correctly', async (tx) => {
            await waitFor(async () => {
                 // Check for formatted change
                const changeBN = new BN(tx.change.toString());
                const formattedChange = formatWei(changeBN, true, 8).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, ''); // remove trailing zeros and dot
                const expectedChangeText = `${changeBN.gtn(0) ? '+' : ''}${formattedChange}`;
                expect(await screen.findByText(expectedChangeText, {exact: false})).toBeInTheDocument();


                // Check for formatted balance
                const balanceBN = new BN(tx.balance.toString());
                const formattedBalance = formatWei(balanceBN, true, 8).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
                expect(await screen.findByText(formattedBalance, {exact: false})).toBeInTheDocument();

                // Check for date
                const date = new Date(tx.transaction_date);
                expect(await screen.findByText(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), {exact: false})).toBeInTheDocument();
            });

            if (tx.transaction_type === 'transfer' && tx.method === 'send') {
                expect(await screen.findByTestId('IconSend')).toBeInTheDocument();
                expect(await screen.findByText(/sent \$audio/i)).toBeInTheDocument();
                expect(await screen.findByRole('link', { name: `@${(tx.metadata as any).handle}` })).toHaveAttribute('href', `/${(tx.metadata as any).handle}`);
            } else if (tx.transaction_type === 'transfer' && tx.method === 'receive') {
                expect(await screen.findByTestId('IconReceive')).toBeInTheDocument();
                expect(await screen.findByText(/received \$audio/i)).toBeInTheDocument();
                expect(await screen.findByRole('link', { name: `@${(tx.metadata as any).handle}` })).toHaveAttribute('href', `/${(tx.metadata as any).handle}`);
            } else if (tx.transaction_type === 'user_reward') {
                expect(await screen.findByTestId('IconTrending')).toBeInTheDocument();
                expect(await screen.findByText(/claimed reward/i)).toBeInTheDocument();
            } else if (tx.transaction_type === 'purchase_stripe') {
                expect(await screen.findByTestId('IconCart')).toBeInTheDocument();
                expect(await screen.findByText(/track purchased/i)).toBeInTheDocument();
                expect(await screen.findByText((tx.metadata as any).content_title)).toBeInTheDocument();
            } else if (tx.transaction_type === 'track_premium_sale') {
                expect(await screen.findByTestId('IconTokenAudius')).toBeInTheDocument(); // Assuming IconToken for sales
                expect(await screen.findByText(/track sold/i)).toBeInTheDocument();
                expect(await screen.findByText((tx.metadata as any).content_title)).toBeInTheDocument();
                expect(await screen.findByRole('link', { name: `@${(tx.metadata as any).handle}` })).toHaveAttribute('href', `/${(tx.metadata as any).handle}`);
            }
        });
        
        it('Load More button fetches and displays more transactions', async () => {
            const initialTxCount = 3;
            const loadMoreTxCount = 2;
            const totalTx = initialTxCount + loadMoreTxCount;
            allTransactions = Array.from({length: totalTx}, (_, i) => ({ ...mockTransactionsArray[0], signature: `sig_page_${i}`}));

            const {user} = renderAudioPage(currentUserId, allTransactions.slice(0, initialTxCount));

            expect(await screen.findAllByText(/claim reward/i)).toHaveLength(initialTxCount);
            
            const loadMoreButton = await screen.findByRole('button', {name: /load more/i});
            expect(loadMoreButton).toBeInTheDocument();
            
            // @ts-ignore
            AudiusBackend.getAudioTransactions.mockImplementation(async ({ offset, limit }) => {
                const paginatedData = allTransactions.slice(offset, offset + limit)
                return { data: paginatedData, count: paginatedData.length, total: allTransactions.length }
            })
            
            await user.click(loadMoreButton);

            await waitFor(async () => {
                expect(await screen.findAllByText(/claim reward/i)).toHaveLength(totalTx);
            });
            expect(screen.queryByRole('button', {name: /load more/i})).not.toBeInTheDocument(); // Button should disappear if all loaded
        });
    });

    describe('Send Flow', () => {
      const validRecipientAddress = recipientUserWallet
      const validAmount = '10' // $AUDIO

      it('Send Button: input and confirmation', async () => {
        const { user } = renderAudioPage(currentUserId)
        const sendButton = await screen.findByRole('button', { name: /send \$audio/i })
        await user.click(sendButton)
        
        const modalSendButton = await screen.findByRole('button', { name: /send/i, selector: 'button[type="submit"]' })
        const recipientInput = await screen.findByPlaceholderText(/enter recipient address/i)
        const amountInput = await screen.findByPlaceholderText(/enter amount/i)

        // Invalid address
        await user.type(recipientInput, 'invalidAddress')
        await user.type(amountInput, validAmount)
        await user.click(modalSendButton)
        expect(await screen.findByText(/invalid address/i)).toBeInTheDocument()

        // Non-numeric amount
        await user.clear(recipientInput); await user.clear(amountInput);
        await user.type(recipientInput, validRecipientAddress)
        await user.type(amountInput, 'abc')
        await user.click(modalSendButton)
        expect(await screen.findByText(/must be a number/i)).toBeInTheDocument()

        // Insufficient balance
        await user.clear(recipientInput); await user.clear(amountInput);
        await user.type(recipientInput, validRecipientAddress)
        await user.type(amountInput, '1000') // More than balance
        await user.click(modalSendButton)
        expect(await screen.findByText(/insufficient balance/i)).toBeInTheDocument()

        // Valid input - shows confirmation
        await user.clear(recipientInput); await user.clear(amountInput);
        await user.type(recipientInput, validRecipientAddress)
        await user.type(amountInput, validAmount)
        await user.click(modalSendButton)

        // Check for confirmation screen
        expect(await screen.findByText(/confirm send/i)).toBeInTheDocument()
        expect(await screen.findByText(`@${recipientUserHandle}`)).toBeInTheDocument() // Recipient handle
        expect(await screen.findByText(`${validAmount}.00000000`)).toBeInTheDocument() // Amount
        expect(await screen.findByRole('button', { name: /confirm send/i })).toBeInTheDocument()
      })

      it('Send Flow Success: confirms send, updates balance, shows success', async () => {
        const { user } = renderAudioPage(currentUserId)
        const sendButton = await screen.findByRole('button', { name: /send \$audio/i })
        await user.click(sendButton)

        const recipientInput = await screen.findByPlaceholderText(/enter recipient address/i)
        const amountInput = await screen.findByPlaceholderText(/enter amount/i)
        const modalSendButton = await screen.findByRole('button', { name: /send/i, selector: 'button[type="submit"]' })

        await user.type(recipientInput, validRecipientAddress)
        await user.type(amountInput, '10') // Send 10 AUDIO
        await user.click(modalSendButton)

        const confirmSendButton = await screen.findByRole('button', { name: /confirm send/i })
        await user.click(confirmSendButton)

        expect(walletActions.sendWAudio).toHaveBeenCalledWith({
            recipientWallet: validRecipientAddress,
            amount: new BN('1000000000'), // 10 AUDIO in Wei
            mint: 'audio'
        })
        
        // Simulate success from action (which would call the API mock)
        // @ts-ignore - Mocking API client directly for simplicity here
        apiClient.sendWAudio.mockResolvedValueOnce({ signature: 'simulated_tx_signature' })
        // Trigger the success path if your component relies on it
        // For example, if it dispatches a success action, you might need to simulate that.
        // Or if it directly updates state on API success.
        
        await waitFor(async () => {
            // Check for success message in modal or page
            expect(await screen.findByText(/your transaction has succeeded/i)).toBeInTheDocument()
            // Check for updated balance (100 - 10 = 90)
            expect(await screen.findByText('90.00')).toBeInTheDocument()
        }, {timeout: 3000})
      })

      it('Send Flow Error: shows error message on API failure', async () => {
        const { user } = renderAudioPage(currentUserId)
        const sendButton = await screen.findByRole('button', { name: /send \$audio/i })
        await user.click(sendButton)

        const recipientInput = await screen.findByPlaceholderText(/enter recipient address/i)
        const amountInput = await screen.findByPlaceholderText(/enter amount/i)
        const modalSendButton = await screen.findByRole('button', { name: /send/i, selector: 'button[type="submit"]' })

        await user.type(recipientInput, 'errorWalletAddress') // Use a wallet that triggers error
        await user.type(amountInput, '10')
        await user.click(modalSendButton)
        
        const confirmSendButton = await screen.findByRole('button', { name: /confirm send/i })
        // @ts-ignore - Mocking API client directly for simplicity here
        apiClient.sendWAudio.mockRejectedValueOnce(new Error('Simulated API Error'))

        await user.click(confirmSendButton)
        
        await waitFor(async () => {
            expect(await screen.findByText(/transaction failed/i)).toBeInTheDocument()
        })
      })
    })
  })

  describe('Unauthenticated User', () => {
    it('prompts to sign up or log in', async () => {
      renderAudioPage(null) 
      expect(await screen.findByText(/create an account to continue/i)).toBeInTheDocument()
      expect(await screen.findByRole('button', { name: /sign up free/i })).toBeInTheDocument()
    })
  })
})
