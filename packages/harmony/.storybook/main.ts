import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin'
import { StorybookConfig } from '@storybook/react-webpack5'

const config: StorybookConfig = {
  staticDirs: ['./public'],
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(mdx|ts|tsx)'],
  addons: [
    'storybook-dark-mode',
    {
      name: '@storybook/addon-essentials',
      options: {
        backgrounds: false
      }
    },
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
    '@storybook/addon-interactions',
    '@storybook/addon-links'
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {}
  },
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
        test: /\.svg$/i,
        issuer: /\.[jt]sx?|mdx?$/,
        use: ['@svgr/webpack']
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
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [{ loader: 'file-loader' }]
      },
      ...config.module.rules
    ]

    config.resolve.plugins = [new TsconfigPathsPlugin()]

    return config
  }
}

export default config
