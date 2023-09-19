import { useEffect, useState } from 'react'
import { FileUploader } from "react-drag-drop-files"
//@ts-ignore
import XMLParser from "react-xml-parser"
import { appStore } from './store';

const fileTypes = ["XML"]
const parser = new XMLParser()

export const Ingest = () => {
        const [file, setFile] = useState<File | null>(null)
        const setRawXml = appStore((state) => state.setRawXml)
        const setParsedXml = appStore((state) => state.setParsedXml)

        // fx
        const readFile = async () => {
            const rawXml = await file?.text();
            if (rawXml === undefined) return
            setRawXml(rawXml)

            const parsedXml = parser.parseFromString(rawXml)
            setParsedXml(parsedXml)
        }
        useEffect(() => {
            readFile();
        }, [file])
    return (
        <>
        <FileUploader handleChange={setFile} name="ddex-file" types={fileTypes} />
        </>
    )
}
