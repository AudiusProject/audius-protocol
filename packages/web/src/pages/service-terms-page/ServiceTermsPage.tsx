import Footer from 'components/public-site/Footer'
import NavBanner from 'components/public-site/NavBanner'
// import Footer from 'components/public-site/FooterV2'
// import NavBanner from 'components/public-site/NavBannerV2'

import styles from './ServiceTermsPage.module.css'

const BASENAME = import.meta.env.PUBLIC_URL

const messages = {
  download: 'Download Service Terms'
}

const serviceTermsDocumentRoute = `${BASENAME}/documents/ServiceTerms.pdf`

type ServiceTermsPageProps = {
  isMobile: boolean
  openNavScreen: () => void
  setRenderPublicSite: (shouldRender: boolean) => void
}

const ServiceTermsPage = (props: ServiceTermsPageProps) => {
  return (
    <div id='serviceTermsPage' className={styles.container}>
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
              href={serviceTermsDocumentRoute}
              className={styles.downloadLink}
              download
            >
              {messages.download}
            </a>
          </div>
        ) : (
          <iframe
            title='Terms of Service'
            src={serviceTermsDocumentRoute}
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

export default ServiceTermsPage
