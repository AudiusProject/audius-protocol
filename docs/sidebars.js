module.exports = {
  learn: [
    {
      type: 'category',
      label: 'Introduction',
      items: ['learn/introduction/getting-started'],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Core Concepts',
      items: [
        'learn/concepts/token',
        'learn/concepts/protocol',
        'learn/architecture/content-node',
        'learn/architecture/discovery-node',
        'learn/concepts/staking-and-delegating',
      ],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Contributing',
      items: ['learn/contributing/overview', 'learn/contributing/governance'],
      collapsed: false,
    },
  ],

  developers: [
    {
      type: 'category',
      label: 'Introduction',
      items: [
        'developers/introduction/overview',
        'developers/guides/create-audius-app',
        // 'developers/introduction/resources'
      ],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Guides',
      items: ['developers/guides/log-in-with-audius', 'developers/guides/hedgehog'],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'The Graph',
      items: [
        'developers/subgraph/overview',
        'developers/subgraph/entities',
        'developers/subgraph/queries',
      ],
      collapsed: false,
    },
  ],

  sdk: [
    {
      type: 'category',
      label: 'Javascript SDK',
      items: [
        'developers/sdk/overview',
        'developers/sdk/tracks',
        'developers/upload-track-metadata',
        'developers/sdk/users',
        'developers/sdk/playlists',
        'developers/sdk/albums',
        'developers/sdk/resolve',
        'developers/sdk/oauth',
        'developers/sdk/advanced-options',
      ],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Community Projects',
      items: [
        'developers/community-projects/unreal-engine-plugin',
        'developers/community-projects/go-sdk',
      ],
      collapsed: false,
    },
  ],

  distributors: [
    {
      type: 'category',
      label: 'Introduction',
      items: ['distributors/introduction/overview'],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Specification',
      items: [
        'distributors/specification/overview',
        'distributors/specification/metadata',
        {
          type: 'category',
          label: 'Deal Types',
          items: [
            'distributors/specification/deal-types/recommended',
            'distributors/specification/deal-types/supported-deal-types',
          ],
          collapsed: false,
        },
      ],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Self Serve',
      items: ['distributors/self-serve/overview', 'distributors/self-serve/run-a-ddex-server'],
      collapsed: false,
    },
  ],

  node_operators: [
    {
      type: 'category',
      label: 'Introduction',
      items: ['node-operator/overview'],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Staking',
      items: [
        'node-operator/staking/stake',
        'node-operator/staking/delegate',
        'node-operator/staking/claim',
      ],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Run a Node',
      items: [
        'node-operator/setup/overview',
        'node-operator/setup/wallet-management',
        'node-operator/setup/hardware-requirements',
        'node-operator/setup/installation',
        'node-operator/setup/advanced',
        'node-operator/sla',
        'node-operator/migration-guide',
      ],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Register a Node',
      items: [
        'node-operator/setup/registration/registration',
        'node-operator/setup/registration/multi-sig-wallet',
      ],
      collapsed: false,
    },
  ],

  reference: [
    {
      type: 'category',
      label: 'Introduction',
      items: ['reference/overview', 'reference/whitepaper'],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Protocol Dashboard',
      items: ['reference/protocol-dashboard/link-profile'],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Contracts and Programs',
      items: ['reference/eth-contracts', 'reference/solana-programs'],
      collapsed: false,
    },
  ],

  api: [
    {
      type: 'doc',
      id: 'developers/api/api',
    },
    {
      type: 'category',
      label: 'users',
      items: [
        {
          type: 'doc',
          id: 'developers/api/get-bulk-users',
          label: 'Get Bulk Users',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/get-user-by-handle',
          label: 'Get User by Handle',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/get-ai-attributed-tracks-by-user-handle',
          label: 'Get AI Attributed Tracks by User Handle',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/get-user-id-from-wallet',
          label: 'Get User ID from Wallet',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/search-users',
          label: 'Search Users',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/verify-id-token',
          label: 'Verify ID Token',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/get-user',
          label: 'Get User',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/get-authorized-apps',
          label: 'Get Authorized Apps',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/get-user-challenges',
          label: 'Get User Challenges',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/get-connected-wallets',
          label: 'Get connected wallets',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/get-developer-apps',
          label: 'Get Developer Apps',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/get-favorites',
          label: 'Get Favorites',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/get-followers',
          label: 'Get Followers',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/get-following',
          label: 'Get Following',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/get-muted-users',
          label: 'Get Muted Users',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/get-purchasers',
          label: 'Get purchasers',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/download-purchases-as-csv',
          label: 'Download Purchases as CSV',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/get-related-users',
          label: 'Get Related Users',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/get-remixers',
          label: 'Get remixers',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/get-reposts',
          label: 'Get Reposts',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/get-sales-aggregate',
          label: 'Get Sales Aggregate',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/download-sales-as-csv',
          label: 'Download Sales as CSV',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/get-subscribers',
          label: 'Get Subscribers',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/get-supporters',
          label: 'Get Supporters',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/get-supported-users',
          label: 'Get Supported Users',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/get-top-track-tags',
          label: "Fetch most used tags in a user's tracks",
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/get-tracks-by-user',
          label: 'Get Tracks by User',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/get-user-tracks-remixed',
          label: 'Get User Tracks Remixed',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/download-usdc-withdrawals-as-csv',
          label: 'Download USDC Withdrawals as CSV',
          className: 'api-method get',
        },
      ],
    },
    {
      type: 'category',
      label: 'playlists',
      items: [
        {
          type: 'doc',
          id: 'developers/api/get-bulk-playlists',
          label: 'Get Bulk Playlists',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/get-playlist-by-handle-and-slug',
          label: 'Get Playlist By Handle and Slug',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/search-playlists',
          label: 'Search Playlists',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/get-trending-playlists',
          label: 'Get Trending Playlists',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/get-playlist',
          label: 'Get Playlist',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/get-playlist-access-info',
          label: 'Get Playlist Access Info',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/get-playlist-tracks',
          label: 'Get Playlist Tracks',
          className: 'api-method get',
        },
      ],
    },
    {
      type: 'category',
      label: 'tracks',
      items: [
        {
          type: 'doc',
          id: 'developers/api/get-bulk-tracks',
          label: 'Get Bulk Tracks',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/search-tracks',
          label: 'Search Tracks',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/get-trending-tracks',
          label: 'Get Trending Tracks',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/get-underground-trending-tracks',
          label: 'Get Underground Trending Tracks',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/get-track',
          label: 'Get Track',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/get-track-access-info',
          label: 'Get Track Access Info',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/track-comment-count',
          label: 'Track Comment Count',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/track-comment-notification-setting',
          label: 'Track Comment Notification Setting',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/track-comments',
          label: 'Track Comments',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/download-track',
          label: 'Download the original or MP3 file of a track',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/inspect-track',
          label: 'Inspects the details of the file for a track',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/get-track-stems',
          label: 'Get Track Stems',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/stream-track',
          label: 'Get the streamable MP3 file of a track',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/get-track-top-listeners',
          label: 'Get Track Top Listeners',
          className: 'api-method get',
        },
      ],
    },
    {
      type: 'category',
      label: 'challenges',
      items: [
        {
          type: 'doc',
          id: 'developers/api/get-undisbursed-challenges',
          label: 'Get Undisbursed Challenges',
          className: 'api-method get',
        },
      ],
    },
    {
      type: 'category',
      label: 'tips',
      items: [
        {
          type: 'doc',
          id: 'developers/api/get-tips',
          label: 'Get Tips',
          className: 'api-method get',
        },
      ],
    },
    {
      type: 'category',
      label: 'developer_apps',
      items: [
        {
          type: 'doc',
          id: 'developers/api/get-developer-app',
          label: 'Get Developer App',
          className: 'api-method get',
        },
      ],
    },
    {
      type: 'category',
      label: 'dashboard_wallet_users',
      items: [
        {
          type: 'doc',
          id: 'developers/api/bulk-get-dashboard-wallet-users',
          label: 'Bulk get dashboard wallet users',
          className: 'api-method get',
        },
      ],
    },
    {
      type: 'category',
      label: 'resolve',
      items: [
        {
          type: 'doc',
          id: 'developers/api/resolve',
          label:
            'Resolves and redirects a provided Audius app URL to the API resource URL it represents',
          className: 'api-method get',
        },
      ],
    },
    {
      type: 'category',
      label: 'comments',
      items: [
        {
          type: 'doc',
          id: 'developers/api/get-unclaimed-comment-id',
          label: 'Get unclaimed comment ID',
          className: 'api-method get',
        },
        {
          type: 'doc',
          id: 'developers/api/get-comment-replies',
          label: 'Get Comment Replies',
          className: 'api-method get',
        },
      ],
    },
  ],
}
