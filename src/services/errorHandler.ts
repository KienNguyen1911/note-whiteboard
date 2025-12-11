/**
 * Utility để xử lý lỗi từ Supabase
 */

export class SupabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'SupabaseError';
  }
}

export const handleSupabaseError = (error: any): string => {
  if (!error) {
    return 'Có lỗi không xác định';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error.message) {
    return error.message;
  }

  return 'Có lỗi không xác định';
};

export const logError = (context: string, error: any) => {
  console.error(`[${context}]`, error);
  
  if (process.env.NODE_ENV === 'development') {
    // Có thể gửi đến error tracking service trong production
  }
};
