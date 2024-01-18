const lightCodeTheme = require("prism-react-renderer/themes/dracula");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

// With JSDoc @type annotations, IDEs can provide config autocompletion
/** @type {import('@docusaurus/types').DocusaurusConfig} */
(
  module.exports = {
    title: "Audius Docs",
    tagline: "",
    url: "https://docs.audius.org",
    baseUrl: "/",
    favicon: "img/favicon.ico",
    organizationName: "AudiusProject", // Usually your GitHub org/user name.
    projectName: "docs.audius.org", // Usually your repo name.
    onBrokenLinks: 'throw',
    onBrokenMarkdownLinks: 'throw',

    presets: [
      [
        "@docusaurus/preset-classic",
        /** @type {import('@docusaurus/preset-classic').Options} */
        ({
          docs: {
            path: "docs",
            routeBasePath: "/",
            sidebarPath: require.resolve("./sidebars.js"),
            editUrl: "https://github.com/AudiusProject/docs.audius.org/",
          },
          theme: {
            customCss: require.resolve("./src/css/custom.css"),
          },
        }),
      ],
    ],
    // i18n: {
    //   defaultLocale: "en",
    //   locales: [
    //     "en",
    //     "es",
    //     "fr",
    //     // "zh"
    //   ],
    //   // localesNotBuilding: ["ko", "pt", "vi", "zh", "ja"],
    //   localeConfigs: {
    //     en: {
    //       label: "English",
    //     },
    //     es: {
    //       label: "Español",
    //     },
    //     // zh: {
    //     //   label: "中文",
    //     // },
    //     fr: {
    //       label: "Français",
    //     },
    //   },
    // },
    themeConfig:
      /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
      ({
        navbar: {
          title: "Audius Docs",
          logo: {
            alt: "Audius Docs Logo",
            src: "img/logo.png",
            srcDark: "img/logo-white.png",
          },
          items: [
            {
              label: "Welcome",
              to: "welcome",
              position: "left",
            },
            {
              label: "Protocol",
              to: "/category/protocol",
              position: "left",
            },
            {
              label: "Token",
              to: "/category/token",
              position: "left",
            },
            {
              label: "Developers",
              to: "/category/developers",
              position: "left",
            },
            {
              href: "https://discord.com/invite/audius",
              label: "Chat",
              position: "right",
            },
            {
              href: "https://github.com/AudiusProject",
              label: "GitHub",
              position: "right",
            },
          ],
        },
        algolia: {
          appId: "5HE2PIGNOV",
          // This API key is "search-only" and safe to be published
          apiKey: "347af1fe50a2533f274a4a64a695c64c",
          indexName: "audius",
          contextualSearch: true,
        },
        footer: {
          style: "dark",
          links: [
            {
              title: "Docs",
              items: [
                {
                  label: "Welcome",
                  to: "welcome",
                },
                {
                  label: "Protocol Overview",
                  to: "protocol/overview",
                },
                {
                  label: "Developers",
                  to: "/category/developers",
                },
              ],
            },
            {
              title: "Community",
              items: [
                {
                  label: "Discord",
                  href: "https://discord.com/invite/audius",
                },
                {
                  label: "Twitter",
                  href: "https://twitter.com/audius",
                },
              ],
            },
            {
              title: "More",
              items: [
                {
                  label: "GitHub",
                  href: "https://github.com/AudiusProject",
                },
              ],
            },
          ],
          copyright: `Copyright © ${new Date().getFullYear()} Audius, Inc. Built with Docusaurus.`,
        },
        prism: {
          theme: lightCodeTheme,
          darkTheme: darkCodeTheme,
        },
      }),
  }
);
