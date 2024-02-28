// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from 'prism-react-renderer'

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Audius Docs',
  tagline: '',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://docs.audius.org',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'AudiusProject', // Usually your GitHub org/user name.
  projectName: 'docs.audius.org', // Usually your repo name.

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          path: 'docs',
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/AudiusProject/docs.audius.org/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        gtag: {
          trackingID: 'G-XSRDQBKXVX',
          anonymizeIP: true,
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      // image: 'img/docusaurus-social-card.jpg',
      navbar: {
        title: 'Audius',
        logo: {
          alt: 'Audius Logo',
          src: 'img/logo.png',
          srcDark: 'img/logo-white.png',
        },
        items: [
          {
            label: 'Learn',
            to: '/',
            position: 'right',
          },
          {
            label: 'Developers',
            to: '/developers/introduction/overview',
            position: 'right',
          },
          {
            label: 'Staking',
            to: '/node-operator/overview',
            position: 'right',
          },
          {
            label: 'Reference',
            to: '/reference/overview',
            position: 'right',
          },
          {
            'aria-label': 'Discord',
            className: 'navbar--discord-link',
            href: 'https://discord.com/invite/audius',
            position: 'right',
          },
          {
            'aria-label': 'GitHub',
            className: 'navbar--github-link',
            href: 'https://github.com/AudiusProject',
            position: 'right',
          },
        ],
      },
      algolia: {
        appId: '5HE2PIGNOV',
        // This API key is "search-only" and safe to be published
        apiKey: '347af1fe50a2533f274a4a64a695c64c',
        indexName: 'audius',
        contextualSearch: true,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],
}

export default config
