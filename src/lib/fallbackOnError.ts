// Function to handle error fallback with generic type T
export default function fallbackOnErr<T, Fallback = T>(value: T | Error, fallback: Fallback): T | Fallback {
  if (value instanceof Error) return fallback;
  return value;
}
