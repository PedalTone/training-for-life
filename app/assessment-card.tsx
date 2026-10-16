"use client";

import { useEffect, useRef, useState } from 'react';
import { assessmentRevision, assessmentUrl, validateAssessment, type AssessmentNotice } from './assessment';

const CACHE_KEY = 't4l:assessment-notice', READ_KEY = 't4l:assessment-read';
const FOLDER_URL = 'https://drive.google.com/drive/folders/1YJ98Xnn-ET46O70_xYzYqy1rkZQX0PbQ';
export function AssessmentCard() {
  const [assessment, setAssessment] = useState<AssessmentNotice | null>(null);
  const [read, setRead] = useState(''), [opened, setOpened] = useState(false);
  const [busy, setBusy] = useState(true), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const refresh = useRef<() => void>(() => {});
  const reader = useRef<HTMLDivElement>(null);
  useEffect(() => {
    try { setAssessment(validateAssessment(JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'))); setRead(localStorage.getItem(READ_KEY) || ''); } catch { /* Still check the latest published notice. */ }
    let controller: AbortController | null = null, disposed = false, lastCheck = 0;
    async function check(force = false) {
      if (!force && Date.now() - lastCheck < 60_000) return;
      lastCheck = Date.now(); controller?.abort(); controller = new AbortController();
      const active = controller; const timer = setTimeout(() => active.abort(), 12_000);
      setBusy(true); setError('');
      try {
        const result = await fetch(new URL('./assessment-latest.json', document.baseURI), { cache: 'no-store', signal: active.signal });
        if (!result.ok) throw new Error('unavailable');
        const next = validateAssessment(await result.json()); if (!next) throw new Error('invalid');
        if (disposed || active !== controller) return;
        setAssessment(next);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(next)); } catch { /* Network notice remains usable for this visit. */ }
      } catch { if (!disposed && active === controller) setError('Could not check for updates. You can still open the saved assessment or check Google Drive.'); }
      finally { clearTimeout(timer); if (!disposed && active === controller) setBusy(false); }
    }
    refresh.current = () => { void check(true); };
    const resume = () => { if (document.visibilityState === 'visible') void check(); };
    window.addEventListener('focus', resume); document.addEventListener('visibilitychange', resume); void check();
    return () => { disposed = true; controller?.abort(); window.removeEventListener('focus', resume); document.removeEventListener('visibilitychange', resume); };
  }, []);
  const unread = assessment && read !== assessmentRevision(assessment);
  const date = assessment ? new Date(assessment.modifiedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  function markRead() {
    if (!assessment) return;
    const revision = assessmentRevision(assessment);
    try { localStorage.setItem(READ_KEY, revision); setRead(revision); setNotice('Marked as read. Choose the days that work for you below.'); }
    catch { setNotice('Could not remember read status on this device. The assessment is still available.'); }
  }
  return <section className="settings-card assessment-card" aria-label="Grok Bot assessment">
    <div className="assessment-heading"><span className="kicker">BEFORE YOU PLAN</span>{assessment && <span className={`assessment-badge${unread ? ' unread' : ''}`}>{unread ? 'New assessment' : 'Read'}</span>}</div>
    <h2>Your weekly assessment</h2>
    <p>Read Grok Bot’s review, then choose what to do each day.</p>
    <div className="assessment-status" role="status">{busy ? 'Checking for an assessment…' : assessment ? `Latest report · ${date}` : 'No assessment notice available yet.'}</div>
    {error && <p className="assessment-error" role="status">{error}</p>}
    {assessment && <button className="wide-action assessment-read" type="button" aria-expanded={opened} aria-controls="assessment-reader" onClick={() => { setOpened(!opened); if (!opened) requestAnimationFrame(() => reader.current?.focus()); }}>{opened ? 'Close assessment' : unread ? 'Read new assessment' : 'Read assessment again'} <span aria-hidden="true">{opened ? '−' : '↓'}</span></button>}
    {assessment && opened && <div id="assessment-reader" className="assessment-reader" ref={reader} tabIndex={-1}>
      <div className="assessment-reader-heading"><h3>Grok Bot assessment</h3><p>Private Google Drive viewer. Sign in to your Google account if asked.</p><a href={assessmentUrl(assessment)} target="_blank" rel="noopener noreferrer">Open in Google Drive ↗</a></div>
      <iframe key={assessmentRevision(assessment)} title="Latest Grok Bot assessment" src={assessmentUrl(assessment, true)} referrerPolicy="no-referrer" allow="fullscreen" />
      <p className="assessment-viewer-help">Blank or unable to sign in? Use “Open in Google Drive” above. Return here when you’re ready to plan.</p>
      <button className="wide-action" type="button" onClick={() => { markRead(); }}>Mark as read</button>
      <button className="assessment-plan-link" type="button" onClick={() => { setOpened(false); const mapping = document.querySelector<HTMLDetailsElement>('.more-page .schedule-card'); if (mapping) { mapping.open = true; mapping.scrollIntoView({ block: 'start', behavior: 'smooth' }); mapping.querySelector<HTMLElement>('summary')?.focus({ preventScroll: true }); } }}>Choose my week’s workouts ↓</button>
    </div>}
    {notice && <p role="status">{notice}</p>}
    <div className="assessment-footer"><button type="button" onClick={() => refresh.current()} disabled={busy}>Check for updates</button><a href={FOLDER_URL} target="_blank" rel="noopener noreferrer">Assessments folder ↗</a></div>
    {assessment && <small className="assessment-sync-note">Drive checked {new Date(assessment.checkedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}. New report notices sync Sundays after 8 p.m.</small>}
  </section>;
}
