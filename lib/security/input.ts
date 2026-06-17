const CONTROL_CHARS_EXCEPT_WHITESPACE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function sanitizeTextInput(value: string, maxLength: number) {
  return value
    .replace(CONTROL_CHARS_EXCEPT_WHITESPACE, "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeSingleLine(value: string, maxLength: number) {
  return sanitizeTextInput(value, maxLength)
    .replace(/[\n\t\r]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
