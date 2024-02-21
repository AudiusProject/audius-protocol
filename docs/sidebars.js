module.exports = {
  developers: [
    {
      type: 'category',
      label: 'Introduction',
      items: ['developers/introduction/overview', 'developers/introduction/resources'],
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
      label: 'SDK',
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
      items: ['learn/concepts/protocol', 'learn/concepts/token', 'learn/concepts/nodes'],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'learn/architecture/overview',
        'learn/architecture/content-node',
        'learn/architecture/discovery-node',
      ],
      collapsed: false,
    },
  ],
}
