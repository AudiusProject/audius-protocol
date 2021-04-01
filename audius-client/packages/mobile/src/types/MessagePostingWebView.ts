import WebView from 'react-native-webview'

export type MessagePostingWebView = WebView & {
  postMessage: (message: string) => void
}
