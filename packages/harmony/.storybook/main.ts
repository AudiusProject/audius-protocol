import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin'
import { StorybookConfig } from '@storybook/react-webpack5'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(mdx|ts|tsx)'],
  addons: [
    {
      name: '@storybook/addon-essentials',
      options: {
        backgrounds: false
      }
    },
    '@storybook/addon-a11y',
    '@storybook/addon-themes'
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {}
  },
  babel: (options) => ({
    ...options,
    presets: [...(options?.presets ?? []), '@emotion/babel-preset-css-prop']
  }),
  docs: {
    autodocs: true,
    // autodocs: 'tag',
    defaultName: 'Documentation'
  },
  webpackFinal: (config: any) => {
    config.module.rules.find(
      (rule) => rule.test.toString() === '/\\.css$/'
    ).exclude = /\.module\.css$/

    config.module.rules = config.module.rules.filter(
      (rule) => rule.test && !rule.test.test('.svg')
    )

    config.module.rules = [
      {
        test: /\.svg$/,
        use: [
          {
            loader: '@svgr/webpack'
          },
          {
            loader: 'file-loader'
          }
        ],
        type: 'javascript/auto',
        issuer: {
          and: [/\.(ts|tsx|md|mdx)$/]
        }
      },
      {
        test: /\.module\.css$/,
        use: [
          require.resolve('style-loader'),
          {
            loader: require.resolve('css-loader'),
            options: {
              importLoaders: 1,
              modules: {
                localIdentName: '[name]__[local]___[hash:base64:5]'
              }
            }
          }
        ]
      },
      ...config.module.rules
    ]

    config.resolve.plugins = [new TsconfigPathsPlugin()]

    return config
  }
}

export default config
