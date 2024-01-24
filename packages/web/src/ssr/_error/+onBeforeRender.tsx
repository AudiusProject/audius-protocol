export async function onBeforeRender() {
  return {
    pageContext: {
      pageProps: {
        error: {
          isErrorPageOpen: true
        }
      }
    }
  }
}
