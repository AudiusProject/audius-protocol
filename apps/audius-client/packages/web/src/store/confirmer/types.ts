interface Confirmable {
  index: number
  calls: Call[]
}

interface Call {
  call: any
  result: any
}

export interface ConfirmerState {
  confirm: { [key: number]: Confirmable }
  complete: { [key: number]: any }
}
