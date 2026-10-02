export function getApiError(error) {
  const data = error?.response?.data;

  if (data?.errors && typeof data.errors === 'object') {
    return {
      message: data.message || 'Validation failed',
      errors: data.errors,
    };
  }

  if (typeof data?.message === 'string' && data.message.length > 0) {
    return {
      message: data.message,
      errors: {},
    };
  }

  return {
    message: 'Something went wrong. Please try again.',
    errors: {},
  };
}
