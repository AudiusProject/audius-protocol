import { Helmet } from 'react-helmet'

const messages = {
  dotAudius: '• Audius',
  audius: 'Audius'
}

export type MetaTagsProps = {
  title?: string
  description?: string
  ogDescription?: string
  image?: string
  canonicalUrl?: string
  structuredData?: object
  noIndex?: boolean
}

export const MetaTags = (props: MetaTagsProps) => {
  const {
    title,
    description,
    ogDescription,
    image,
    canonicalUrl,
    structuredData,
    noIndex = false
  } = props

  const formattedTitle = title
    ? `${title} ${messages.dotAudius}`
    : messages.audius

  return (
    <>
      {/* noIndex */}
      {noIndex ? (
        <Helmet>
          <meta name='robots' content='noindex'></meta>
        </Helmet>
      ) : null}

      {/* Title */}
      <Helmet>
        <title>{formattedTitle}</title>
        <meta property='og:title' content={formattedTitle} />
        <meta name='twitter:title' content={formattedTitle} />
      </Helmet>

      {/* Description */}
      {description ? (
        <Helmet encodeSpecialCharacters={false}>
          <meta name='description' content={description} />
        </Helmet>
      ) : null}

      {/* OG Description - This is the actual description of the content, for example a Track description */}
      {ogDescription ? (
        <Helmet encodeSpecialCharacters={false}>
          <meta property='og:description' content={ogDescription} />
          <meta name='twitter:description' content={ogDescription} />
        </Helmet>
      ) : null}

      {/* Canonical URL */}
      {canonicalUrl ? (
        <Helmet encodeSpecialCharacters={false}>
          <link rel='canonical' href={canonicalUrl} />
          <meta property='og:url' content={canonicalUrl} />
        </Helmet>
      ) : null}

      {/* Image */}
      {image ? (
        <Helmet encodeSpecialCharacters={false}>
          <meta property='og:image' content={image} />
          <meta name='twitter:image' content={image} />
        </Helmet>
      ) : null}

      <meta property='og:type' content='website' />
      <meta name='twitter:card' content='summary' />

      {structuredData && (
        <script type='application/ld+json'>
          {JSON.stringify(structuredData)}
        </script>
      )}
    </>
  )
}
