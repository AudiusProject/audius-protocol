const messages = {
  header: 'Pick Your Handle'
}

export type PickHandleState = {
  stage: 'pick-handle'
}

export const PickHandlePage = () => {
  return (
    <div>
      <h1>{messages.header}</h1>
    </div>
  )
}
