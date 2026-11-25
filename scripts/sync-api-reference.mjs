// SJYC_SERVER_DIR을 지정하면 서버 컨트롤러와 클라이언트 어댑터에서 명세를 다시 만든다.
import { writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import ts from 'typescript';

const server = resolve(process.env.SJYC_SERVER_DIR ?? '../Server');
function project(root) {
  const config = ts.readConfigFile(join(root, 'tsconfig.json'), ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  return ts.createProgram(parsed.fileNames, parsed.options);
}
const program = project(server);
const types = program.getTypeChecker();
const client = project(process.cwd());
const clientTypes = client.getTypeChecker();
const adapter = client.getSourceFile(resolve('src/api/http.ts'));
const contracts = new Map();
const routeKey = (verb, path) => verb + ' ' + path.replace(/:\w+/g, ':param');
function visitAdapter(node, names = []) {
  if (ts.isPropertyAssignment(node) || ts.isMethodDeclaration(node))
    names = [...names, node.name.getText(adapter)];
  if (ts.isArrowFunction(node) || ts.isMethodDeclaration(node)) {
    const call = node.getText(adapter).match(/request\('(GET|POST|PATCH|PUT|DELETE)',\s*(['`])(.*?)\2/s);
    if (call) {
      const [, verb, , raw] = call;
      const path = raw.replace(/\$\{enc\((\w+)\)\}/g, ':$1');
      const signature = clientTypes.getSignatureFromDeclaration(node);
      const result = clientTypes.getAwaitedType(clientTypes.getReturnTypeOfSignature(signature));
      contracts.set(routeKey(verb, path), {
        call: names.join('.'),
        args: node.parameters.map((p) => p.name.getText(adapter)),
        path,
        result: clientTypes.typeToString(result),
      });
    }
    return;
  }
  ts.forEachChild(node, (child) => visitAdapter(child, names));
}
visitAdapter(adapter);
function decorators(node) {
  return Object.fromEntries(
    (ts.getDecorators(node) ?? []).map((d) => {
      const expr = d.expression;
      return [
        expr.expression.getText(),
        expr.arguments[0] && (ts.isStringLiteral(expr.arguments[0]) || ts.isNumericLiteral(expr.arguments[0]))
          ? expr.arguments[0].text
          : '',
      ];
    }),
  );
}
function fields(param, kind, arg) {
  if (arg)
    return [
      {
        name: arg,
        kind,
        type: 'string',
        required: !param.questionToken && !param.type?.getText().includes('undefined'),
      },
    ];
  const t = types.getTypeAtLocation(param);
  return t.getProperties().map((prop) => {
    const fieldType = types.getTypeOfSymbolAtLocation(prop, param);
    const repr = types
      .typeToString(fieldType, undefined, ts.TypeFormatFlags.NoTruncation)
      .replace(/import\("[^"]+"\)\./g, '');
    const type = repr === '"on"' ? 'boolean' : repr.replace(/ \| undefined/g, '');
    return {
      name: prop.name,
      kind,
      type: type.length > 210 ? 'object' : type,
      required:
        !(prop.flags & ts.SymbolFlags.Optional) &&
        !(fieldType.isUnion() && fieldType.types.some((x) => x.flags & ts.TypeFlags.Undefined)) &&
        !(kind === 'query' && ['page', 'pageSize', 'periodDays'].includes(prop.name)) &&
        !(kind === 'body' && ['agreeMarketing', 'pinned', 'published', 'reservable'].includes(prop.name)),
    };
  });
}
const routes = [];
for (const file of program.getSourceFiles().filter((f) => f.fileName.endsWith('.controller.ts'))) {
  for (const cls of file.statements.filter(ts.isClassDeclaration)) {
    const parent = decorators(cls);
    if (!('Controller' in parent)) continue;
    for (const method of cls.members.filter(ts.isMethodDeclaration)) {
      const d = decorators(method);
      const verb = ['Get', 'Post', 'Patch', 'Put', 'Delete'].find((k) => k in d);
      if (!verb) continue;
      const path = '/' + [parent.Controller, d[verb]].filter(Boolean).join('/');
      const http = verb.toUpperCase(),
        mapping = contracts.get(routeKey(http, path));
      const params = method.parameters.flatMap((p) => {
        const dec = decorators(p);
        for (const kind of ['Param', 'Query', 'Body'])
          if (kind in dec) return fields(p, kind.toLowerCase(), dec[kind]);
        return [];
      });
      const pathNames = [...path.matchAll(/:(\w+)/g)].map((m) => m[1]);
      const clientNames = [...(mapping?.path ?? '').matchAll(/:(\w+)/g)].map((m) => m[1]);
      const args = (mapping?.args ?? []).map((n) => {
        if (clientNames.includes(n)) return 'param.' + pathNames[clientNames.indexOf(n)];
        if (n === 't') return 'target';
        if (n === 'query') return 'query';
        const field = params.find((f) => f.name === n && f.kind !== 'param');
        if (field) return field.kind + '.' + n;
        if (['input', 'patch'].includes(n)) return 'body';
        throw Error('어댑터 인자 확인 필요 ' + path + ' ' + n);
      });
      const status =
        ['confirm', 'oauthStart'].includes(method.name.getText()) && path.startsWith('/auth/')
          ? 302
          : Number(d.HttpCode ?? (http === 'POST' ? 201 : 200));
      routes.push({
        method: http,
        path,
        access:
          path === '/auth/session'
            ? 'session'
            : (d.RequirePermission ??
              parent.RequirePermission ??
              ('Public' in d || 'Public' in parent ? 'public' : 'session')),
        params,
        status,
        result:
          status === 302
            ? 'Location'
            : status === 204
              ? 'void'
              : (mapping?.result?.replace(/import\("[^"]+"\)\./g, '') ??
                (path === '/health' ? '{ status: string }' : 'unknown')),
        call: mapping?.call ?? '',
        args,
      });
    }
  }
}
if (new Set(routes.map((r) => r.method + ' ' + r.path)).size !== routes.length) throw Error('경로 중복');
routes.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
writeFileSync(resolve('src/features/specifications/routes.json'), JSON.stringify(routes, null, 2) + '\n');
process.stdout.write(routes.length + '개 경로, ' + contracts.size + '개 어댑터 메서드\n');
