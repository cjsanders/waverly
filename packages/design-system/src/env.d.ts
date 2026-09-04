// Vite and Astro both resolve `?url` imports to the asset's public URL.
declare module '*.svg?url' {
  const src: string
  export default src
}
