// 오픈소스 라이선스 고지 목록 생성 — 웹(루트)·앱(mobile)의 직접 의존 패키지에서 읽는다.
// 사용: pnpm oss:licenses (의존성을 바꾼 뒤 다시 실행)
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = join(import.meta.dirname, '..');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function repoUrl(pkg) {
  const raw =
    pkg.homepage ?? (typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url) ?? '';
  return raw
    .replace(/^git\+/, '')
    .replace(/^git:\/\//, 'https://')
    .replace(/\.git$/, '')
    .replace(/^github:/, 'https://github.com/')
    .replace(/^([\w.-]+\/[\w.-]+)$/, 'https://github.com/$1');
}

function collect(projectDir) {
  const { dependencies = {} } = readJson(join(projectDir, 'package.json'));
  return Object.keys(dependencies)
    .sort()
    .map((name) => {
      const pkg = readJson(join(projectDir, 'node_modules', name, 'package.json'));
      const license = typeof pkg.license === 'string' ? pkg.license : (pkg.license?.type ?? 'UNKNOWN');
      return { name, version: pkg.version, license, url: repoUrl(pkg) };
    });
}

const web = collect(root);
const mobile = collect(resolve(process.env.SJYC_MOBILE_DIR ?? join(root, '..', 'Mobile')));

const out = `// 자동 생성 — scripts/gen-oss-licenses.mjs (pnpm oss:licenses). 직접 수정하지 않는다.
export interface OssPackage {
  name: string;
  version: string;
  license: string;
  url: string;
}

/** 웹 서비스가 직접 사용하는 오픈소스 패키지 */
export const OSS_WEB: OssPackage[] = ${JSON.stringify(web, null, 2)};

/** 모바일 앱(iOS·Android)이 직접 사용하는 오픈소스 패키지 */
export const OSS_MOBILE: OssPackage[] = ${JSON.stringify(mobile, null, 2)};
`;

writeFileSync(join(root, 'src', 'config', 'oss-licenses.ts'), out);
process.stdout.write(`web ${web.length}, mobile ${mobile.length} packages
`);
