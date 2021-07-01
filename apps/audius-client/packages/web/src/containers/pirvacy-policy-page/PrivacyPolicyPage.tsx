import React from 'react'

import Footer from 'components/public-site/Footer'
import NavBanner from 'components/public-site/NavBanner'

import styles from './PrivacyPolicyPage.module.css'

const messages = {
  download: 'Download Privacy Policy'
}

const privacyPolicyDocumentRoute = '/documents/PrivacyPolicy.pdf'

type PrivacyPolicyPageProps = {
  isMobile: boolean
  openNavScreen: () => void
  setRenderPublicSite: (shouldRender: boolean) => void
}

const PrivacyPolicyPage = (props: PrivacyPolicyPageProps) => {
  return (
    <div id='privacyPolicyPage' className={styles.container}>
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
              href={privacyPolicyDocumentRoute}
              className={styles.downloadLink}
              download
            >
              {messages.download}
            </a>
          </div>
        ) : (
          <iframe
            title='Privacy Policy'
            src={privacyPolicyDocumentRoute}
            className={styles.pdfIFrame}
          ></iframe>
        )}
      </div>
      <Footer isMobile={props.isMobile} />
    </div>
  )
}

export default PrivacyPolicyPage
