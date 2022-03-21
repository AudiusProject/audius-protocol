// eslint-disable-next-line @typescript-eslint/no-extraneous-class
declare class Utils {
  static wait(milliseconds: number): Promise<void>
  static keccak256(address: string): string 
}

export default Utils
