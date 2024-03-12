import Footer from 'public-site/components/Footer'
import NavBanner from 'public-site/components/NavBanner'
import { env } from 'services/env'

import styles from './TermsOfUsePage.module.css'

const BASENAME = env().BASENAME

const messages = {
  download: 'Download Terms of Use'
}

const termsOfUseDocumentRoute = `${BASENAME}/documents/TermsOfUse.pdf`

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
      <Footer
        isMobile={props.isMobile}
        setRenderPublicSite={props.setRenderPublicSite}
      />
    </div>
  )
}

export default TermsOfUsePage
