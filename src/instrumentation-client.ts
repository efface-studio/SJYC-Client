import { config } from 'zod/v4/core';

// CSP가 동적 코드 평가를 차단하므로 Zod는 브라우저에서 일반 파서를 사용한다.
config({ jitless: true });
