import { createContext, useState } from 'react'

export const PauseContext = createContext({
  setPopoverVisibility: () => {},
  popoverVisibility: false
})

export const PauseContextProvider = (props) => {
  const [popoverVisibility, setPopoverVisibility] = useState(false)

  return (
    <PauseContext.Provider
      value={{
        popoverVisibility,
        setPopoverVisibility
      }}
    >
      {props.children}
    </PauseContext.Provider>
  )
}
