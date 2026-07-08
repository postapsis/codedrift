/*
 * Author: Jamius Siam
 * Since: 22/06/2026
 */
export type ApiResponse<T> = {
  success: boolean;
  message: string | null;
  data: T;
};
