// TODO: do this on the backend


/** Types */

export type MessageHeader = {
    messageId: string,
    sender: string,
    senderId: string,
    recipient: string,
    recipientId: string,
    createdAt: string,
    controlType: string,
}

export type SoundRecordings = SoundRecording[]

export type SoundRecording = {
    soundRecordingType: string,
    id: string,
    referenceTitle: string,
    duration: string,
    artist: string,
    genre: string,
    fileRef: string,
}

export type CoverArt = {
    fileRef: string,
}

export type Releases = Release[]

export type Release = {
    id: string,
    // matches with soundRecording.referenceTitle
    referenceTitle: string,
    releaseType: string,
    artist: string,
    genre: string
}

/** Extractors */

export const extractMessageHeader = (xml: Document): MessageHeader => {
    const header = xml.getElementsByTagName("MessageHeader")[0]
    const messageId = header.getElementsByTagName("MessageId")[0].childNodes[0].nodeValue!
    const messageSender = header.getElementsByTagName("MessageSender")[0]
    const senderId = messageSender.getElementsByTagName("PartyId")[0].childNodes[0].nodeValue!
    const sender = messageSender.getElementsByTagName("PartyName")[0].getElementsByTagName("FullName")[0].childNodes[0].nodeValue!
    const messageRecipient = header.getElementsByTagName("MessageRecipient")[0]
    const recipientId = messageRecipient.getElementsByTagName("PartyId")[0].childNodes[0].nodeValue!
    const recipient = messageRecipient.getElementsByTagName("PartyName")[0].getElementsByTagName("FullName")[0].childNodes[0].nodeValue!
    const createdAt = header.getElementsByTagName("MessageCreatedDateTime")[0].childNodes[0].nodeValue!
    const controlType = header.getElementsByTagName("MessageControlType")[0].childNodes[0].nodeValue!
    return {
        messageId,
        senderId,
        sender,
        recipient,
        recipientId,
        createdAt,
        controlType
    }
}

export const extractSoundRecordings = (xml: Document): SoundRecordings => {
    const resourceList = xml.getElementsByTagName("ResourceList")[0]
    const soundRecordings = resourceList.getElementsByTagName("SoundRecording")
    const recordings = [...soundRecordings].map(extractSoundRecording)
    return []
}

export const extractSoundRecording = (el: Element): SoundRecording => {
    const soundRecordingType = el.getElementsByTagName("SoundRecordingType")[0].childNodes[0].nodeValue!
    const 

}

export const extractCoverArt = (xml: Document): CoverArt => {
    return { fileRef: "" }
}

export const extractReleases = (xml: Document): Releases => {
    return []
}
