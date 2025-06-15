export default function normalizeDelimiters(string: string, delimiter = ' ') {
  // target all common delimiter types and replace with the new delimter
  return string
    .replace(/[a-z][A-Z]|[a-zA-Z]\d|\d[a-zA-Z]/g, v => `${v[0]}${delimiter}${v[1]}`)
    .replace(/[\s-_]/g, delimiter);
}
