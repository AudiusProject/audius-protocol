import { appStore } from "./store";

const parser = new DOMParser()

export const Validate = () => {
    const xml = appStore((state) => state.xmlRaw)!
    const xmlDoc = parser.parseFromString(xml, "text/xml")

    return (<div>
        Validation Page
        <div>{xmlDoc.getElementsByTagName("MessageHeader")[0].getElementsByTagName("MessageId")[0].childNodes[0].nodeValue}</div>
    </div>)
}
