import { expect, test } from 'vitest';
import { getApiError } from './apiError';

test('api errors keep field messages and hide missing responses', () => {
  expect(getApiError({
    response: { data: { message: 'Validation failed', errors: { amount: 'Amount must be greater than 0' } } },
  })).toEqual({
    message: 'Validation failed',
    errors: { amount: 'Amount must be greater than 0' },
  });

  expect(getApiError(new Error('database password leaked'))).toEqual({
    message: 'Something went wrong. Please try again.',
    errors: {},
  });
});
