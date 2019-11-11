import ReactDOMServer from 'react-dom/server'
import React from 'react'

const WrapComponent = (props) => {
  const renderedChildren = ReactDOMServer.renderToStaticMarkup(props.children)
  return <div dangerouslySetInnerHTML={{
    __html: `
    <!--[if ${props.if}]>${props.extraWrapper}<![endif]-->
    ${renderedChildren}
    <!--[if ${props.if}]>${props.endExtraWrapper}</td></tr></table></center><![endif]-->
  ` }}
  />
}

export default WrapComponent
