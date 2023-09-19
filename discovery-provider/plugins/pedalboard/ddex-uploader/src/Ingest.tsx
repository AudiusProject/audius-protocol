import { useEffect, useState } from 'react'
import { FileUploader } from "react-drag-drop-files"
//@ts-ignore
import XMLParser from "react-xml-parser"
import { State, appStore } from './store';

const fileTypes = ["XML"]
const parser = new XMLParser()

export const Ingest = () => {
        const [file, setFile] = useState<File | null>(null)
        const setRawXml = appStore((state) => state.setRawXml)
        const setParsedXml = appStore((state) => state.setParsedXml)
        const xmlRaw = appStore((state) => state.xmlRaw)
        const xmlParsed = appStore((state) => state.xmlParsed)
        const toState = appStore((state) => state.toState)
        const ingested = xmlRaw !== null && xmlParsed !== null

        const readFile = async () => {
            const rawXml = await file?.text();
            if (rawXml === undefined) return
            // remove xml comments should they exist
            const sanitizedXml = rawXml.replace(/<!--[\s\S]*?-->/g, '')
            setRawXml(sanitizedXml)

            const parsedXml = parser.parseFromString(sanitizedXml)
            setParsedXml(parsedXml)
        }

        useEffect(() => {
            readFile();
        }, [file])

        // once this page is done, move to next
        if (ingested) toState(State.Validate)


    return (
        <>
            <FileUploader handleChange={setFile} name="ddex-file" types={fileTypes} multiple={false} />
        </>
    )
}
