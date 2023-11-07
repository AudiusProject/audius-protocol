const importWorkerScript = (script) => {
  // eslint-disable-next-line
  if (self.location.origin !== 'blob://') {
    // eslint-disable-next-line
    let origin = location.origin
    // eslint-disable-next-line
    if (basename) origin += basename
    // eslint-disable-next-line
    importScripts(origin + script)
  } else {
    // eslint-disable-next-line
    const href = self.location.href.replace(self.location.protocol, '')
    const protocol = href.split('//')[0]
    const origin = href.split('//')[1].split('/')[0]
    // eslint-disable-next-line
    importScripts(protocol + '//' + origin + script)
  }
}

export default importWorkerScript
