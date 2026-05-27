import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, StatusBar, goBack } from '../../../shared/components';
import { TimeRangeSelect } from './Details';

// search-filter.jsx — 체크리스트 기반 검색 (search box filter icon target)

export function ChecklistFilterScreen() {
  const navigate = useNavigate();
  const livingFilters = [
    { q: '취침 시간', key: '취침', value: { start: 23, end: 1 }, time: true },
    { q: '기상 시간', key: '기상', value: { start: 7, end: 9 }, time: true },
    { q: '귀가', options: ['유동적', '고정적'] },
    { q: '청소', options: ['주기적', '비주기적'] },
    { q: '방에서 전화', options: ['가능', '불가능'] },
    { q: '잠귀', options: ['밝음', '어두움'] },
    { q: '잠버릇', options: ['심함', '중간', '약함'] },
    { q: '코골이', options: ['심함', '중간', '약함~없음'] },
    { q: '샤워시간', options: ['아침', '저녁'] },
    { q: '방에서 취식', options: ['가능', '불가능', '환기필수'] },
    { q: '소등', options: ['시간 지정', '한명 잘 때'] },
    { q: '본가 주기', options: ['매주', '2주', '한달이상'] },
    { q: '흡연', options: ['비흡연만'] },
    { q: '냉장고', options: ['대여·구매·보유', '협의 후 결정', '필요 없음'] },
  ];

  const extraFilters = [
    { q: '드라이기 제한', value: { start: 12, end: 19 }, time: true },
    { q: '알람', options: ['진동', '소리'] },
    { q: '이어폰', options: ['항상', '유동적'] },
    { q: '키스킨', options: ['항상', '유동적'] },
    { q: '무소음 마우스', options: ['사용', '미사용', '유동적'] },
    { q: '더위', options: ['많이 탐', '중간', '적게 탐'] },
    { q: '추위', options: ['많이 탐', '중간', '적게 탐'] },
    { q: '공부', options: ['기숙사 밖', '기숙사 안', '유동적'] },
    { q: '쓰레기통', options: ['개별', '공유'] },
  ];
  const [selected, setSelected] = React.useState({});

  const [ranges, setRanges] = React.useState({
    취침: { start: 23, end: 1 },
    기상: { start: 7, end: 9 },
    '드라이기 제한': { start: 12, end: 19 },
  });

  const selectedFor = (key) => selected[key] || [];
  const toggleOption = (key, option) => {
    setSelected((prev) => {
      const current = prev[key] || [];
      const next = current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option];
      return { ...prev, [key]: next };
    });
  };
  const clearAll = () => setSelected({});
  const countActive = (filters) => filters.filter((f) => !f.time && selectedFor(f.q).length > 0).length;
  const activeCount = countActive(livingFilters) + countActive(extraFilters);

  const renderRow = (f, key) => (
	    <div key={key} style={{
	      display: 'flex', alignItems: 'center', gap: 14,
	      padding: '12px 0', borderBottom: '1px solid var(--line)',
	    }}>
	      <div style={{ width: 76, flexShrink: 0, minHeight: 34, display: 'flex', alignItems: 'center', fontSize: 14, color: 'var(--ink-2)', fontWeight: 500 }}>{f.q}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {f.time ? (
          <TimeRangeSelect
            value={ranges[f.key || f.q]}
            onChange={(v) => setRanges({ ...ranges, [f.key || f.q]: v })}
          />
        ) : (
	          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
	            {f.options.map((o, i) => {
	              const isSel = selectedFor(f.q).includes(o);
	              return (
	                <button key={o} type="button" onClick={() => toggleOption(f.q, o)} style={{
	                  padding: '6px 10px',
	                  borderRadius: 999,
	                  background: isSel ? 'var(--ink)' : 'transparent',
	                  border: isSel ? '1px solid var(--ink)' : '1px solid var(--line-2)',
	                  color: isSel ? 'white' : 'var(--ink-2)',
	                  fontSize: 12, fontWeight: isSel ? 700 : 500,
	                  whiteSpace: 'nowrap',
	                  fontFamily: 'inherit',
	                  cursor: 'pointer',
	                }}>{o}</button>
	              );
	            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="screen">
      <StatusBar />
      <div style={{ padding: '6px 12px 8px', display: 'grid', gridTemplateColumns: '72px 1fr 72px', alignItems: 'center', minHeight: 48 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <button onClick={() => goBack(navigate, '/rooms/find')} style={{ background: 'transparent', border: 0, padding: 8, color: 'var(--ink)', cursor: 'pointer' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', textAlign: 'center', minWidth: 0 }}>체크리스트로 찾기</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
	          <button onClick={clearAll} style={{ background: 'transparent', border: 0, padding: '6px 0', color: activeCount ? 'var(--brand)' : 'var(--ink-3)', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}>전체 해제</button>
        </div>
      </div>

      <div className="scroll" style={{ padding: '0 20px' }}>
        {/* Intro */}
        <div style={{ padding: '14px 0 14px' }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px', lineHeight: 1.35 }}>
            원하는 조건으로<br/>방을 찾아볼 수 있어요
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>
            여러 옵션을 동시에 선택할 수 있어요
          </div>
        </div>

        {/* Section 1 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0 8px' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px' }}>생활 패턴</h2>
	          <span style={{ fontSize: 11, color: 'var(--brand)', fontWeight: 700 }}>적용 {countActive(livingFilters)}</span>
        </div>
        <div className="card" style={{ padding: '0 16px', marginBottom: 16 }}>
          {livingFilters.map((f, i) => renderRow(f, 'L' + i))}
        </div>

        {/* Section 2 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0 8px' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px' }}>추가 규칙</h2>
	          <span style={{ fontSize: 11, color: 'var(--brand)', fontWeight: 700 }}>적용 {countActive(extraFilters)}</span>
        </div>
        <div className="card" style={{ padding: '0 16px', marginBottom: 16 }}>
          {extraFilters.map((f, i) => renderRow(f, 'E' + i))}
        </div>

        <div style={{ height: 110 }}/>
      </div>

      {/* Sticky CTA */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        padding: '14px 16px 30px',
        background: 'var(--surface)', borderTop: '1px solid var(--line)',
      }}>
	        <button onClick={() => navigate('/rooms/find')} className="btn full" style={{ height: 52 }}>
	          {activeCount ? `${activeCount}개 조건으로 보기` : '조건 없이 보기'}
	        </button>
      </div>
    </div>
  );
}
