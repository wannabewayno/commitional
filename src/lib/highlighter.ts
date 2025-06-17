export type styleFn = (value: string) => string;

/**
 * A Simple function that encapsultes two 'style' functions in a closer and applys them to
 * @param valueStyle - A style function that takes in a value to display, transforms it and returns the transformed "styled" content for display
 * @param defaultStyle - A style function to apply to any default value that may be used when the value is not defined to visually show that we're showing a default due to a failed lookup or missing parameter.
 * @returns
 */
export default function Highlighter(valueStyle: styleFn, defaultStyle = valueStyle) {
  return (value?: string, defaultValue?: string) => (value ? valueStyle(value) : defaultStyle(defaultValue ?? 'unknown'));
}
