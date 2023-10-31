/**
 * The Harmony svgr template wraps imported svgs in our typography/Icon component
 * allowing users to set harmony colors and sizes through props.
 * For further reading, reference https://react-svgr.com/docs/custom-templates/
 * */
const template = (variables, context) => {
  const { tpl } = context

  variables.jsx.openingElement.name.name = 'Icon'
  variables.jsx.closingElement.name.name = 'Icon'

  // Append a {...props} to the opening element's attributes
  // Reference: https://facebook.github.io/jsx/
  variables.jsx.openingElement.attributes.push({
    type: 'JSXSpreadAttribute',
    argument: {
      type: 'Identifier',
      name: 'props'
    }
  })

  return tpl`
${variables.imports};
import { Icon } from 'components/typography/Icons/Icon'

${variables.interfaces};


const ${variables.componentName} = (props) => {
  const {color} = props
  return ${variables.jsx} 
};

${variables.exports};
`
}

module.exports = template
