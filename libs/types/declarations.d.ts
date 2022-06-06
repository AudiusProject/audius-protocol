/// <reference lib="dom" />
declare interface GlobalFetch {
  fetch(input: RequestInfo, init?: RequestInit): Promise<Response>
}