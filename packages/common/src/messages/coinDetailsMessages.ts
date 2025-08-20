export const coinDetailsMessages = {
  balance: {
    becomeAMember: 'Become a Member',
    hintDescription: (title: string) =>
      `Buy ${title} to gain access to exclusive members-only perks!`
  },
  coinInfo: {
    loading: 'Loading...',
    createdBy: 'Created By',
    whatIs: (title: string) => `What is ${title}?`,
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
    pricePerCoin: 'Price per coin',
    holdersOnAudius: 'Holders on Audius',
    uniqueHolders: 'Unique Holders',
    volume24hr: 'Volume (24hr)',
    totalTransfers: 'Total Transfers'
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
    builtIn: 'Built-In',
    toasts: {
      walletRemoved: 'Wallet removed successfully!',
      error: 'Error removing wallet'
    }
  }
}
