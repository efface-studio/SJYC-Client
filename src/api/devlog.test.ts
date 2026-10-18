import { apiLog, withLogging } from './devlog';
import { ApiError } from './errors';

const client = {
  programs: {
    list: async (q: { page: number }) => ({ items: [], page: q.page }),
    fail: async () => {
      throw new ApiError('FORBIDDEN', '권한 없음');
    },
  },
  version: 1,
};

beforeEach(() => apiLog.clear());

describe('API 요청 로그', () => {
  it('중첩된 메서드 호출을 이름·결과와 함께 기록하고 반환값은 그대로 돌려준다', async () => {
    const logged = withLogging(client);
    await expect(logged.programs.list({ page: 2 })).resolves.toEqual({ items: [], page: 2 });
    await expect(logged.programs.fail()).rejects.toBeInstanceOf(ApiError);
    const [fail, ok] = apiLog.entries();
    expect(ok).toMatchObject({ method: 'programs.list', ok: true });
    expect(fail).toMatchObject({ method: 'programs.fail', ok: false, error: 'FORBIDDEN' });
    expect(logged.version).toBe(1);
  });

  it('요청 인자(개인정보가 담길 수 있음)는 기록하지 않는다', async () => {
    await withLogging(client).programs.list({ page: 3 });
    expect(JSON.stringify(apiLog.entries())).not.toContain('"page"');
  });

  it('최근 200건만 보관한다', async () => {
    const logged = withLogging(client);
    for (let i = 0; i < 205; i++) await logged.programs.list({ page: i });
    expect(apiLog.entries()).toHaveLength(200);
  });
});
