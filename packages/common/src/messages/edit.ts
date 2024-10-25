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
    description: {
      track: 'Only fans who make a purchase can play your track',
      album: 'Only fans who make a purchase can play your album.'
    },
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

export const advancedTrackMessages = {
  title: 'Advanced',
  description:
    'Provide detailed metadata to help identify and manage your music.',
  isAiGenerated: 'AI-Generated',
  bpm: {
    header: 'Tempo',
    label: 'BPM',
    validError: 'Must be a valid decimal number'
  },
  musicalKey: 'Key',
  aiGenerated: {
    header: 'AI Generated',
    description: 'Mark this track as AI generated',
    tooltip:
      'If your AI-generated track was trained on an existing Audius artist, you can give them credit here. Only users who have opted-in will appear in this list.',
    placeholder: 'Search for Users',
    requiredError: 'Valid user must be selected.'
  },
  apiAllowed: {
    header: 'Disallow Streaming via the API',
    description:
      'Keep your track from being streamed on third-party apps or services that utilize the Audius API.'
  },
  disableComments: {
    header: 'Disable Comments',
    description: 'Prevent anyone from leaving a comment on this track.',
    value: 'Comments Disabled'
  },
  isrcTooltip: `ISRC is used to identify individual sound recordings and music videos. ISWC is used to identify the underlying musical composition – the music and lyrics`,
  isrc: {
    header: 'ISRC',
    placeholder: 'CC-XXX-YY-NNNNN',
    validError: 'Must be valid ISRC format.'
  },
  iswc: {
    header: 'ISWC',
    placeholder: 'T-345246800-1',
    validError: 'Must be valid ISWC format.'
  },
  licenseType: 'License Type',
  allowAttribution: {
    header: 'Allow Attribution?',
    options: {
      false: 'No Attribution',
      true: 'Allow Attribution'
    }
  },
  commercialUse: {
    header: 'Commercial Use?',
    options: {
      false: 'Non-Commercial Use',
      true: 'Commercial Use'
    }
  },
  derivativeWorks: {
    header: 'Derivative Works?',
    options: {
      false: 'Not-Allowed',
      true: 'Share-Alike',
      null: 'Allowed'
    }
  },
  noLicense: 'All Rights Reserved',
  releaseDate: 'Release Date',
  coverAttribution: {
    toggle: {
      header: 'This Song is a Cover',
      description: 'This track was written by another artist.'
    },
    attribution: {
      header: 'Cover Attribution',
      description:
        'If your song is a cover, please provide the original title and creator’s name.',
      originalSongTitle: 'Original Song Title',
      originalSongArtist: 'Original Artist'
    }
  }
}

export const advancedAlbumMessages = {
  title: 'Advanced',
  description:
    'Provide detailed metadata to help identify and manage your music.',
  upcValue: 'UPC',
  upcTitle: 'UPC (Universal Product Code)',
  upcDescription:
    'A Universal Product Code (UPC) is a unique barcode that identifies music releases.',
  upcInputLabel: 'UPC',
  upcInputError: 'Invalid UPC',
  releaseDate: {
    title: 'Release Date',
    label: 'Release date'
  }
}
