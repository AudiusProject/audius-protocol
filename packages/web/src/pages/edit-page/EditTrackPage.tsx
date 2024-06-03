import { createContext } from 'react'

import Header from 'components/header/desktop/Header'
import Page from 'components/page/Page'

import { Text } from '@audius/harmony'
import { EditTrackForm } from 'components/edit-track/EditTrackForm'

const messages = {
  title: 'Edit your track'
}

const initialFormState = {}

type UploadPageProps = {
  scrollToTop: () => void
}

export const UploadFormScrollContext = createContext(() => {})

export const EditTrackPage = (props: UploadPageProps) => {
  const { scrollToTop } = props
  //   const dispatch = useDispatch()
  //   const [formState, setFormState] = useState<UploadFormState>(initialFormState)

  return (
    <Page
      title={messages.title}
      header={<Header primary={messages.title} showBackButton />}
    >
      <Text>Hello world</Text>
      {/* <UploadFormScrollContext.Provider value={scrollToTop}>
        <EditTrackForm
          initialValues={{
            tracks: [],
            trackMetadatas: [],
            trackMetadatasIndex: 0
          }}
          // TODO: Add onSubmit
          onSubmit={() => {}}
        />
      </UploadFormScrollContext.Provider> */}
    </Page>
  )
}
