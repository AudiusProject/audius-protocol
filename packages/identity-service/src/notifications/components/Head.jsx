import React from 'react'
import BodyStyles from './BodyStyles'
import FontStyles from './FontStyles'

const Head = (props) => {
  return (
    <div>
      <div dangerouslySetInnerHTML={{
        __html: `
          <!--[if gte mso 15]>
            <xml>
              <o:OfficeDocumentSettings>
                <o:AllowPNG />
                <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
            </xml>
          <![endif]-->
      ` }}
      />
      <meta charset={'UTF-8'} />
      <meta http-equiv={'x-ua-compatible'} content={'IE=edge'} />
      <meta name={'viewport'} content={'width=device-width, initial-scale=1'} />
      <meta name={'x-apple-disable-message-reformatting'} />
      <title>{props.title}</title>
      <FontStyles />
      <BodyStyles />
    </div>
  )
}

export default Head
