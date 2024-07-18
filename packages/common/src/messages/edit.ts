export const visibilityMessages = {
  title: 'Visibility',
  description:
    'Change the visibility of this release or schedule it to release in the future.',
  public: 'Public',
  publicDescription: 'Visible to everyone on Audius.',
  hidden: 'Hidden',
  hiddenDescription:
    'Only you and people you share a direct link with will be able to listen.',
  scheduledRelease: 'Scheduled Release',
  scheduledReleaseDescription:
    'Select the date and time this will become public.',
  hiddenHint: (entityType: 'track' | 'album' | 'playlist') =>
    `You can’t make a public ${entityType} hidden`,
  dateLabel: 'Release Date',
  timeLabel: 'Time',
  futureReleaseHint: (timezone: string) =>
    `This will be released at the selected date/time in your local timezone (${timezone}).`
}

export const priceAndAudienceMessages = {
  title: 'Price & Audience',
  freePremiumDescription:
    'Customize who can listen to this release. Sell your music and create gated experiences for your fans.',
  specialAccessDescription:
    'Customize your music’s audience and create gated experiences for your fans.',
  free: 'Free for Everyone',
  premium: 'Premium',
  specialAccess: 'Special Access',
  collectibleGated: 'Collectible Gated',
  followersOnly: 'Followers Only',
  supportersOnly: 'Supporters Only',
  markedAsRemix:
    'This track is marked as a remix. To enable additional availability options, unmark within Remix Settings.',
  freeRadio: {
    title: 'Free for Everyone',
    description: (contentType: 'album' | 'track') =>
      `Everyone can play your ${contentType} for free.`
  },
  premiumRadio: {
    title: 'Premium',
    description:
      'Unlockable by purchase, these tracks are visible to everyone but only playable by users who have paid for access.',
    waitlist:
      'Start selling your music on Audius today! Limited access beta now available.',
    join: 'Join the Waitlist',
    comingSoon: 'Coming Soon'
  },
  specialAccessRadio: {
    title: 'Special Access',
    description: 'Only fans who meet certain criteria can listen.',
    followersOnly: 'Followers Only',
    supportersOnly: 'Supporters Only'
  },
  collectibleGatedRadio: {
    title: 'Collectible Gated',
    description:
      'Only fans who own a specific, digital collectible can play your track. (These tracks remain hidden from trending lists and user feeds.)',
    learnMore: 'Learn More',
    pickACollection: 'Pick a Collection',
    ownersOf: 'Owners Of',
    noCollectibles:
      'No Collectibles found. To enable this option, link a wallet containing a collectible.'
  }
}
