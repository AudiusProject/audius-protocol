import { extractMessageHeader } from "./ernParser";
import { appStore } from "./store";

const parser = new DOMParser()

export const Validate = () => {
    const xml = appStore((state) => state.xmlRaw)!
    const xmlDoc = parser.parseFromString(xml, "text/xml")

    const messageHeader = extractMessageHeader(xmlDoc)

    return (<div>
        Validation Page
        <div>{Object.entries(messageHeader).map(([key, value]) => {
          return (<div><strong>{key}:</strong> {value}</div>)
        })}</div>
    </div>)
}
