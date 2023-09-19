import { appStore } from "./store";

interface XmlNode {
  name: string;
  attributes: { [key: string]: string };
  children: XmlNode[];
  value: string;
}

// Recursively search for XML nodes by an array of names and return an array of matching nodes in the same order
function searchXmlNodesByNames(node: XmlNode, targetNames: string[]): XmlNode[] {
  let results: XmlNode[] = [];

  if (targetNames.includes(node.name)) {
    results.push(node);
  }

  for (const child of node.children) {
    const childResults = searchXmlNodesByNames(child, targetNames);
    results = results.concat(childResults);
  }

  return results;
}

export const Validate = () => {
    const { children }: { children: XmlNode[] } = appStore((state) => state.xmlParsed)
    const names = ["DisplayArtistName", "LabelName", "Genre", "Image", "ISRC", "TechnicalSoundRecordingDetails"]
    const foundNodes = children.flatMap(node => searchXmlNodesByNames(node, names))

    return (<div>
        Validation Page
        <div>{foundNodes.map((node) => <div> {node.name}: {node.value}</div>)}</div>
    </div>)
}
