import { useEffect, useState } from 'react'
import { FileUploader } from "react-drag-drop-files"
import { JsonView, allExpanded, darkStyles } from 'react-json-view-lite';
//@ts-ignore
import XMLParser from "react-xml-parser"
import './App.css'

const fileTypes = ["XML"]
const parser = new XMLParser()

function App() {
  // state
  const [file, setFile] = useState<File | null>(null)
  const [fileText, setFileText] = useState<any | null>(null)

  // fx
  const readFile = () => {
    file?.text().then((txt) => setFileText(parser.parseFromString(txt)))
    console.dir({ fileText })
  }
  useEffect(readFile, [file])

  return (
    <>
      DDEX Uploader
      <FileUploader handleChange={setFile} name="ddex-file" types={fileTypes} />
      {fileText && <JsonView data={fileText} shouldExpandNode={allExpanded} style={darkStyles} />}
    </>
  )
}

export default App
