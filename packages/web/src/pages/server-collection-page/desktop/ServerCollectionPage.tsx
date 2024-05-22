import { ServerPage } from 'components/page/ServerPage'

export type OwnProps = {
  title: string
  description: string
  canonicalUrl: string
  structuredData?: Object
  // Add Collection Props
}

export const ServerCollectionPage = ({
  title,
  description,
  canonicalUrl,
  structuredData
}: OwnProps) => {
  return (
    <ServerPage
      title={title}
      description={description}
      // ogDescription={defaults.description}
      canonicalUrl={canonicalUrl}
      structuredData={structuredData}
      variant='flush'
      scrollableSearch
      fromOpacity={1}
      // noIndex={defaults.isUnlisted}
    >
      <p>Server Collection Desktop Page</p>
    </ServerPage>
  )
}
