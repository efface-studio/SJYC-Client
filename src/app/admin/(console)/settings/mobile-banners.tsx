import {
  bannerKinds,
  moveBanner,
  newBanner,
  type BannerConfig,
  type MobileBanner,
} from '@/domain/mobile-banners';

export function MobileBannersEditor({
  config,
  onChange: apply,
}: {
  config: BannerConfig;
  onChange: (next: BannerConfig) => void;
}) {
  const items = (next: MobileBanner[]) => apply({ ...config, items: next });
  const patch = (id: string, changes: Partial<MobileBanner>) =>
    items(config.items.map((b) => (b.id === id ? { ...b, ...changes } : b)));
  return (
    <div className="banner-editor">
      <label>
        <input
          type="checkbox"
          checked={config.automatic}
          onChange={(e) => apply({ ...config, automatic: e.target.checked })}
        />{' '}
        모집 중인 프로그램·동아리도 자동으로 표시
      </label>
      <label>
        자동 전환{' '}
        <select
          value={config.seconds}
          onChange={(e) => apply({ ...config, seconds: Number(e.target.value) })}
        >
          <option value={0}>수동으로만 넘기기</option>
          {Array.from({ length: 18 }, (_, i) => i + 3).map((n) => (
            <option key={n} value={n}>
              {n}초
            </option>
          ))}
        </select>
      </label>
      {config.items.map((b, i) => (
        <fieldset key={b.id}>
          <legend>{b.title || '새 배너'}</legend>
          <label>
            제목{' '}
            <input value={b.title} maxLength={70} onChange={(e) => patch(b.id, { title: e.target.value })} />
          </label>
          <label>
            종류{' '}
            <select
              value={b.kind}
              onChange={(e) => {
                const kind = bannerKinds.find((k) => k === e.target.value);
                if (kind) patch(b.id, { kind });
              }}
            >
              {bannerKinds.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </label>
          <label>
            이미지{' '}
            <input
              list={'banner-images-' + b.id}
              value={b.image}
              onChange={(e) => patch(b.id, { image: e.target.value })}
              placeholder="기본 사진 또는 https 이미지 주소"
            />
          </label>
          <datalist id={'banner-images-' + b.id}>
            <option value="program">프로그램 사진</option>
            <option value="club">동아리 사진</option>
            <option value="space">공간 사진</option>
          </datalist>
          <label>
            앱 연결 경로{' '}
            <input
              value={b.path}
              onChange={(e) => patch(b.id, { path: e.target.value })}
              placeholder="/clubs 또는 /programs/항목ID"
            />
          </label>
          <label>
            게시 시작일{' '}
            <input
              type="date"
              value={b.startsOn}
              onChange={(e) => patch(b.id, { startsOn: e.target.value })}
            />
          </label>
          <label>
            게시 종료일{' '}
            <input type="date" value={b.endsOn} onChange={(e) => patch(b.id, { endsOn: e.target.value })} />
          </label>
          <label>
            <input
              type="checkbox"
              checked={b.enabled}
              onChange={(e) => patch(b.id, { enabled: e.target.checked })}
            />{' '}
            앱에 표시
          </label>
          <div className="banner-actions">
            <button type="button" disabled={i === 0} onClick={() => items(moveBanner(config.items, i, -1))}>
              위로
            </button>
            <button
              type="button"
              disabled={i === config.items.length - 1}
              onClick={() => items(moveBanner(config.items, i, 1))}
            >
              아래로
            </button>
            <button type="button" onClick={() => items(config.items.filter((n) => n.id !== b.id))}>
              삭제
            </button>
          </div>
        </fieldset>
      ))}
      <button
        type="button"
        disabled={config.items.length >= 15}
        onClick={() => items([...config.items, newBanner()])}
      >
        배너 추가
      </button>
    </div>
  );
}
