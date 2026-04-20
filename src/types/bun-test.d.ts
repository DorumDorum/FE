declare module 'bun:test' {
  export const describe: (name: string, fn: () => void) => void
  export const test: (name: string, fn: () => void | Promise<void>) => void
  export const expect: <T>(actual: T) => {
    toBe(expected: T): void
    toEqual(expected: unknown): void
  }
}
