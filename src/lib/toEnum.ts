export default function toEnum(input: string[] | Record<string, unknown>): `"${string}"` {
  if (!Array.isArray(input)) input = Object.keys(input);

  return `"${input.join('"|"')}"`;
}
