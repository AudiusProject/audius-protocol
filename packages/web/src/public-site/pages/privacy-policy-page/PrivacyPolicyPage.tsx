import Footer from 'public-site/components/Footer'
import NavBanner from 'public-site/components/NavBanner'
import { env } from 'services/env'

import styles from './PrivacyPolicyPage.module.css'

const BASENAME = env.BASENAME

const messages = {
  download: 'Download Privacy Policy'
}

const privacyPolicyDocumentRoute = `${BASENAME}/documents/PrivacyPolicy.pdf`

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
      <Footer
        isMobile={props.isMobile}
        setRenderPublicSite={props.setRenderPublicSite}
      />
    </div>
  )
}

export default PrivacyPolicyPage
