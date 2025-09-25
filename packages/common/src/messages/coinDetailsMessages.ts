export const coinDetailsMessages = {
  balance: {
    becomeAMember: 'Become a Member',
    hintDescription: (title: string) =>
      `Buy ${title} to gain access to exclusive members-only perks!`
  },
  coinInfo: {
    loading: 'Loading...',
    createdBy: 'Created By',
    description1: (title: string) =>
      `${title} is a community token on the Audius platform. You can use ${title} for tipping artists, participating in community activities, and engaging with the decentralized music ecosystem.`,
    description2: (title: string) =>
      `Holding ${title} gives you access to exclusive features and helps support your favorite artists on Audius.`,
    learnMore: 'Learn More',
    viewLeaderboard: 'View Leaderboard',
    title: 'Bronze +',
    profileFlair: 'Profile Flair',
    customDiscordRole: 'Custom Discord Role',
    messageBlasts: 'Message Blasts',
    openDiscord: 'Open The Discord',
    refreshDiscordRole: 'Refresh Discord Role',
    browseRewards: 'Browse Rewards',
    rewardTiers: 'Reward Tiers',
    discordDisabledTooltip: (coinTicker: string = '') =>
      `Buy ${coinTicker} to access the members only Discord`
  },
  coinInsights: {
    title: 'Insights',
    pricePerCoin: 'Price',
    holdersOnAudius: 'Holders on Audius',
    uniqueHolders: 'Unique Holders',
    volume24hr: 'Volume (24hr)',
    totalTransfers: 'Total Transfers',
    unableToLoad: 'Unable to load insights',
    graduated: 'Graduated',
    preGraduation:
      'Until graduation, the price of this coin is tied to the controlled distribution of supply.',
    postGraduation:
      'This coin has graduated. The price is determined by the open market.'
  },
  coinLeaderboard: {
    title: 'Members Leaderboard',
    leaderboard: 'Leaderboard'
  },
  externalWallets: {
    noBalanceTitle: 'Link External Wallet',
    hasBalanceTitle: 'Balance Breakdown',
    description:
      'Link an external wallet to take advantage of in-app features, and take full control of your assets.',
    loadingText: 'Loading...',
    buttonText: 'Add External Wallet',
    copied: 'Copied To Clipboard!',
    copy: 'Copy Wallet Address',
    remove: 'Remove Wallet',
    options: 'Options',
    newWalletConnected: 'New Wallet Successfully Connected!',
    error: 'Something went wrong. Please try again.',
    walletAlreadyAdded: 'No new wallets selected to connect.',
    builtIn: 'Built-In Wallet',
    toasts: {
      walletRemoved: 'Wallet removed successfully!',
      error: 'Error removing wallet'
    }
  },
  overflowMenu: {
    copyCoinAddress: 'Copy Coin Address',
    openDexscreener: 'Open Dexscreener',
    details: 'Details',
    copiedToClipboard: 'Copied Coin Address To Clipboard!'
  },
  artistCoinDetails: {
    title: 'Artist Coin Details',
    details: 'Details',
    coinAddress: 'Coin Address',
    onChainDescription: 'On-Chain Description',
    totalSupply: 'Total Supply',
    marketCap: 'Market Cap',
    fdv: 'Fully Diluted Valuation',
    price: 'Current Price',
    liquidity: 'Liquidity',
    circulatingSupply: 'Circulating Supply',
    close: 'Close',
    copied: 'Copied to clipboard!',
    tooltips: {
      totalSupply:
        'The total number of your artist coins that will ever exist. This amount is fixed and never changes.',
      marketCap:
        'The current total value of all your artist coins in circulation, calculated by multiplying the current price by the total supply.',
      fdv: 'The theoretical market cap if all tokens were in circulation, calculated by multiplying the current price by the total supply.',
      price: 'The current price of a single artist coin in USD.',
      liquidity:
        'The amount of funds available for trading your artist coin, which affects how easily it can be bought or sold.',
      circulatingSupply:
        'The number of artist coins currently available for trading, excluding any tokens that are locked or reserved.'
    }
  }
}
