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
  ],

  api: [
    {
      type: 'category',
      label: 'Overview',
      items: [
        'developers/api/rest-api',
        // 'developers/api/albums',
        // 'developers/api/resolve',
        // 'developers/api/schemas',
      ],
      collapsed: false,
    },

    {
      type: 'category',
      label: 'Users',
      items: [
        'developers/api/users/get-user',
        'developers/api/users/get-user-by-handle',
        'developers/api/users/get-user-by-wallet',
        'developers/api/users/search-users',
        'developers/api/users/get-tracks',
        'developers/api/users/get-favorites',
        'developers/api/users/get-reposts',
        'developers/api/users/get-followers',
        'developers/api/users/get-following',
        'developers/api/users/get-subscribers',
        'developers/api/users/get-supporters',
        'developers/api/users/get-supportings',

        'developers/api/users/get-most-used-track-tags',
        'developers/api/users/get-ai-tracks-by-handle',
        'developers/api/users/get-related-users',
        'developers/api/users/verify-oauth-token',
        'developers/api/users/get-connected-wallets',
      ],
      collapsed: false,
    },

    {
      type: 'category',
      label: 'Tracks',
      items: [
        'developers/api/tracks/get-track',
        'developers/api/tracks/get-bulk-track',
        'developers/api/tracks/search-tracks',
        'developers/api/tracks/get-trending-tracks',
        'developers/api/tracks/get-underground-trending-tracks',
        'developers/api/tracks/stream-track',
      ],
      collapsed: false,
    },

    {
      type: 'category',
      label: 'Playlists',
      items: [
        'developers/api/playlists/get-playlists',
        'developers/api/playlists/get-playlist-tracks',
        'developers/api/playlists/search-playlists',
        'developers/api/playlists/get-trending-playlists',
      ],
      collapsed: false,
    },

    {
      type: 'category',
      label: 'Tips',
      items: ['developers/api/tips/get-tips'],
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
        'distributors/specification/deal-types',
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
}
