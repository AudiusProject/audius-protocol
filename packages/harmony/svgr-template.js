const template = (variables, context) => {
  const { tpl } = context

  variables.jsx.openingElement.name.name = 'Icon'
  variables.jsx.closingElement.name.name = 'Icon'

  // Append a {...props} to the opening element's attributes
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
  console.log('props?', props)
  return ${variables.jsx} 
};

${variables.exports};
`
}

module.exports = template
