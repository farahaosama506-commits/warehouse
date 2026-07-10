import { ZodError } from 'zod';

export function getValidationErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  const issues = error.issues;
  issues.forEach((issue) => {
    const path = issue.path.join('.') || 'general';
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  });
  return errors;
}