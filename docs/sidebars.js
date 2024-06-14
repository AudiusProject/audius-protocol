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
      label: 'Guides',
      items: [
        'developers/guides/log-in-with-audius',
        'developers/guides/rest-api',
        'developers/guides/hedgehog',
      ],
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
