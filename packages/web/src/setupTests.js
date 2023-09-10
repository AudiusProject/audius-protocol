// eslint-disable-next-line
import '__mocks__/Hashids'

// Mock Canvas / Context2D calls
window.HTMLCanvasElement.prototype.getContext = function () {
  return {
    fillRect: () => {},
    clearRect: () => {},
    getImageData: function (x, y, w, h) {
      return {
        data: new Array(w * h * 4)
      }
    },
    putImageData: () => {},
    createImageData: function () {
      return []
    },
    setTransform: () => {},
    drawImage: () => {},
    save: () => {},
    fillText: () => {},
    restore: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    stroke: () => {},
    translate: () => {},
    scale: () => {},
    rotate: () => {},
    arc: () => {},
    fill: () => {},
    measureText: function () {
      return { width: 0 }
    },
    transform: () => {},
    rect: () => {},
    clip: () => {}
  }
}

window.HTMLCanvasElement.prototype.toDataURL = function () {
  return ''
}

window.web3 = {}

class Worker {
  constructor(stringUrl) {
    this.url = stringUrl
    this.onmessage = () => {}
  }

  postMessage(msg) {
    this.onmessage(msg)
  }
}

window.Worker = Worker

window.URL = {
  createObjectURL: () => {}
}
