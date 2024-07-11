import { useFormikContext } from 'formik'

import { NavigationPrompt } from 'components/navigation-prompt/NavigationPrompt'

const messages = {
  uploadNavigationPrompt: {
    title: 'Discard upload?',
    body: "Are you sure you want to leave this page?\nAny changes you've made will be lost.",
    cancel: 'Cancel',
    proceed: 'Discard'
  },
  editNavigationPrompt: {
    title: 'Discard Edit?',
    body: "Are you sure you want to leave this page?\nAny changes you've made will be lost.",
    cancel: 'Cancel',
    proceed: 'Discard'
  }
}

type CollectionNavigationPromptProps = {
  isUpload?: boolean
}

export const CollectionNavigationPrompt = (
  props: CollectionNavigationPromptProps
) => {
  const { isUpload } = props
  const { dirty } = useFormikContext()
  return (
    <NavigationPrompt
      when={dirty}
      messages={
        isUpload
          ? messages.uploadNavigationPrompt
          : messages.editNavigationPrompt
      }
    />
  )
}
