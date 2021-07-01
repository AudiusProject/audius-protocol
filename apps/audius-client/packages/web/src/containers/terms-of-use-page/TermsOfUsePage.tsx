import React from 'react'

import Footer from 'components/public-site/Footer'
import NavBanner from 'components/public-site/NavBanner'

import styles from './TermsOfUsePage.module.css'

const messages = {
  download: 'Download Terms of Use'
}

const termsOfUseDocumentRoute = '/documents/TermsOfUse.pdf'

type TermsOfUsePageProps = {
  isMobile: boolean
  openNavScreen: () => void
  setRenderPublicSite: (shouldRender: boolean) => void
}

const TermsOfUsePage = (props: TermsOfUsePageProps) => {
  return (
    <div id='termsOfUsePage' className={styles.container}>
      <NavBanner
        invertColors
        className={styles.navBanner}
        isMobile={props.isMobile}
        openNavScreen={props.openNavScreen}
        setRenderPublicSite={props.setRenderPublicSite}
      />
      <div className={styles.contentContainer}>
        {props.isMobile ? (
          <div className={styles.mobileContainer}>
            <a
              href={termsOfUseDocumentRoute}
              className={styles.downloadLink}
              download
            >
              {messages.download}
            </a>
          </div>
        ) : (
          <iframe
            title='Terms of Service'
            src={termsOfUseDocumentRoute}
            className={styles.pdfIFrame}
          ></iframe>
        )}
      </div>
      <Footer isMobile={props.isMobile} />
    </div>
  )
}

export default TermsOfUsePage
