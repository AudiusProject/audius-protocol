module.exports = {
  // home: ['welcome'],

  developers: [
    {
      type: 'category',
      label: 'SDK',
      link: {
        type: 'doc',
        id: 'developers/sdk/sdk',
      },
      items: [
        'developers/sdk/albums',
        'developers/sdk/playlists',
        'developers/sdk/resolve',
        'developers/sdk/tracks',
        'developers/sdk/users',
        'developers/sdk-oauth-methods',
        'developers/advanced-options',
      ],
      collapsed: true,
    },
    'developers/rest-api',
    {
      type: 'category',
      label: 'Subgraph',
      items: [
        'developers/subgraph/data',
        'developers/subgraph/entities',
        'developers/subgraph/queries',
      ],
      collapsed: true,
    },
    'developers/hedgehog',
    'developers/log-in-with-audius',
    'developers/upload-track-metadata',
  ],

  protocol: [
    'protocol/protocol',
    'protocol/whitepaper',
    {
      type: 'category',
      label: 'Content Node',
      items: [
        'protocol/content-node/content-node-overview',
        'protocol/content-node/content-node-architecture',
      ],
      collapsed: true,
    },
    {
      type: 'category',
      label: 'Discovery Node',
      items: [
        'protocol/discovery-node/discovery-node-overview',
        'protocol/discovery-node/discovery-node-architecture',
      ],
      collapsed: true,
    },
  ],

  token: [
    'token/audio',
    'token/staking',
    'token/governance',
    {
      type: 'category',
      label: 'Running a Node',
      link: {
        type: 'doc',
        id: 'token/running-a-node/introduction',
      },
      items: [
        'token/running-a-node/hardware-requirements',
        {
          type: 'category',
          label: 'Setup a Node',
          items: [
            'token/running-a-node/setup/wallet-management',
            'token/running-a-node/setup/installation',
            'token/running-a-node/setup/registration',
            'token/running-a-node/setup/claiming',
            'token/running-a-node/setup/advanced',
          ],
        },
        'token/running-a-node/sla',
      ],
      collapsed: true,
    },
  ],
}
