import { isApiError } from '@/api';
import type { FieldErrors } from '@/domain/schemas';

/** 서버 VALIDATION 응답의 필드별 오류 — 폼 필드 아래에 그대로 표시한다 */
export function serverFieldErrors(error: unknown): FieldErrors {
  return isApiError(error) && error.fieldErrors ? error.fieldErrors : {};
}
