/**
 * allow us to write `import shader from "./path/to/shader.glsl";`
 * and use `shader` as a string.
 */
declare module '*.glsl' {
  const value: string
  export default value
}
