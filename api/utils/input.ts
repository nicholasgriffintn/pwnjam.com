export function sanitizeInput(input: string): string {
  return input.replace(/[^a-zA-Z0-9_-]/g, '');
}
