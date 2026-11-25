'use client';
import Link from 'next/link';
import { useState } from 'react';
import { features } from './features';
import './specifications.css';

export function FeatureReference() {
  const [indexOpen, setIndexOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [key, setKey] = useState(features[0]!.key);
  const list = features.filter((f) =>
    [f.title, f.area, f.role, f.entry, f.inputs, ...f.steps]
      .join(' ')
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const feature = list.find((f) => f.key === key) ?? list[0];
  return (
    <div className="spec-workspace" data-index-open={indexOpen}>
      <button
        type="button"
        className="spec-index-toggle"
        aria-controls="reference-index"
        aria-expanded={indexOpen}
        onClick={() => setIndexOpen(!indexOpen)}
      >
        기능 목차 {indexOpen ? '닫기' : '열기'}
      </button>
      <aside id="reference-index" className="spec-index" aria-label="기능 목차">
        <label>
          기능 찾기
          <input
            type="search"
            placeholder="기능명·화면·권한 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="spec-results">기능 {list.length}개</div>
        <nav aria-label="기능 선택">
          {list.map((f) => (
            <button
              key={f.key}
              aria-current={feature?.key === f.key ? 'true' : undefined}
              onClick={() => {
                setKey(f.key);
                setIndexOpen(false);
              }}
            >
              {f.title}
              <small>{f.area}</small>
            </button>
          ))}
        </nav>
      </aside>
      {feature ? (
        <article className="spec-detail">
          <small>{feature.area}</small>
          <h2>{feature.title}</h2>
          <p>{feature.purpose}</p>
          <dl className="spec-facts">
            <div>
              <dt>사용자·권한</dt>
              <dd>{feature.role}</dd>
            </div>
            <div>
              <dt>진입 화면</dt>
              <dd>{feature.entry}</dd>
            </div>
          </dl>
          <h3>입력과 조건</h3>
          <p>{feature.inputs}</p>
          <h3>처리 흐름</h3>
          <ol>
            {feature.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <h3>예외 처리</h3>
          <p>{feature.exceptions}</p>
          <h3>관련 API</h3>
          <ul className="spec-links">
            {feature.api.map((path) => (
              <li key={path}>
                <Link href={'/admin/specifications/api?endpoint=' + encodeURIComponent(path)}>{path}</Link>
              </li>
            ))}
          </ul>
        </article>
      ) : (
        <p role="status" className="spec-empty">
          검색 결과가 없습니다.
        </p>
      )}
    </div>
  );
}
