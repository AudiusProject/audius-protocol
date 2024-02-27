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
        // 'developers/introduction/resources'
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
      label: 'Javscript SDK',
      items: [
        'developers/sdk/overview',
        'developers/sdk/tracks',
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
      label: 'SubGraph',
      items: [
        'developers/subgraph/overview',
        'developers/subgraph/entities',
        'developers/subgraph/queries',
      ],
      collapsed: false,
    },
  ],

  node_operators: [
    {
      type: 'category',
      label: 'Introduction',
      items: ['node-operator/overview', 'node-operator/sla'],
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
      label: 'Setup a Node',
      items: [
        'node-operator/setup/overview',
        'node-operator/setup/wallet-management',
        'node-operator/setup/hardware-requirements',
        'node-operator/setup/installation',
        {
          type: 'category',
          label: 'Register a Node',
          items: [
            'node-operator/setup/registration/registration',
            'node-operator/setup/registration/multi-sig-wallet',
          ],
          collapsed: true,
        },
        'node-operator/setup/advanced',
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
  ],
}
