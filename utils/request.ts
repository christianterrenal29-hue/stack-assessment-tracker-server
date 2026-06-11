import { AppError } from '../middleware/errorHandler';

export const safeParamString = (
  value: string | string[] | undefined,
  fieldName: string
): string => {
  const normalizedValue = Array.isArray(value) ? value[0] : value;

  if (!normalizedValue) {
    throw new AppError(400, `${fieldName} is required`);
  }

  return normalizedValue;
};

export const safeQueryString = (value: unknown): string | undefined => {
  if (!value) return undefined;

  if (Array.isArray(value)) {
    return value.length > 0 ? safeQueryString(value[0]) : undefined;
  }

  if (typeof value === 'string') {
    return value;
  }

  return undefined;
};
