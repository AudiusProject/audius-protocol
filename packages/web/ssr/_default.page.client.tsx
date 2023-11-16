// This should hydrate index.html

import React from 'react'

import { hydrateRoot } from 'react-dom/client'

import { PageLayout } from './PageLayout'

export async function render(pageContext) {
  const { Page, pageProps } = pageContext
  hydrateRoot(
    document.getElementById('page-view'),
    <PageLayout>
      hi
      {/* <Page {...pageProps} /> */}
    </PageLayout>
  )
}
