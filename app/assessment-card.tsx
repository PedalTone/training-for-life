"use client";

import { useEffect, useRef, useState } from 'react';
import { assessmentRevision, assessmentUrl, validateAssessment, type AssessmentNotice } from './assessment';
import { readAssessmentFile, validateAssessmentDocument, type AssessmentDocument } from './assessment-file';

const CACHE_KEY = 't4l:assessment-notice', READ_KEY = 't4l:assessment-read', DOCUMENT_KEY = 't4l:assessment-document';
const FOLDER_URL = 'https://drive.google.com/drive/folders/1YJ98Xnn-ET46O70_xYzYqy1rkZQX0PbQ';
export function AssessmentCard() {
  const [assessment, setAssessment] = useState<AssessmentNotice | null>(null);
  const [read, setRead] = useState(''), [opened, setOpened] = useState(false);
  const [busy, setBusy] = useState(true), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [selected, setSelected] = useState<AssessmentDocument | null>(null);
  const [reading, setReading] = useState(false), [fileError, setFileError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null), importSequence = useRef(0);
  const refresh = useRef<() => void>(() => {});
  const reader = useRef<HTMLDivElement>(null);
  useEffect(() => {
    try { setAssessment(validateAssessment(JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'))); setRead(localStorage.getItem(READ_KEY) || ''); } catch { /* Still check the latest published notice. */ }
    try { setSelected(validateAssessmentDocument(JSON.parse(localStorage.getItem(DOCUMENT_KEY) || 'null'))); } catch { /* File selection still works without cached text. */ }
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
    return () => { disposed = true; importSequence.current++; controller?.abort(); window.removeEventListener('focus', resume); document.removeEventListener('visibilitychange', resume); };
  }, []);
  const unread = assessment && read !== assessmentRevision(assessment);
  const date = assessment ? new Date(assessment.modifiedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  function markRead() {
    if (!assessment) return;
    const revision = assessmentRevision(assessment);
    try { localStorage.setItem(READ_KEY, revision); setRead(revision); setNotice('Marked as read. Choose the days that work for you below.'); }
    catch { setNotice('Could not remember read status on this device. The assessment is still available.'); }
  }
  function showReader() {
    setOpened(true);
    requestAnimationFrame(() => { reader.current?.focus(); reader.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }); });
  }
  async function selectFile(file: File) {
    const sequence = ++importSequence.current;
    setReading(true); setFileError(''); setNotice('');
    try {
      const document = await readAssessmentFile(file);
      if (sequence !== importSequence.current) return;
      setSelected(document); showReader();
      try { localStorage.setItem(DOCUMENT_KEY, JSON.stringify(document)); }
      catch { setNotice('The report is open, but could not be saved on this device. You can choose the file again next time.'); }
    } catch (error) { if (sequence === importSequence.current) setFileError(error instanceof Error ? error.message : 'Could not read that assessment. Choose a Word or text file.'); }
    finally { if (sequence === importSequence.current) setReading(false); }
  }
  return <section className="settings-card assessment-card" aria-label="Grok Bot assessment">
    <div className="assessment-heading"><span className="kicker">BEFORE YOU PLAN</span>{assessment && <span className={`assessment-badge${unread ? ' unread' : ''}`}>{unread ? 'New assessment' : 'Read'}</span>}</div>
    <h2>Your weekly assessment</h2>
    <p>Choose the latest report in Files. Read it here, then choose what to do each day.</p>
    <div className="assessment-status" role="status">{busy ? 'Checking for an assessment…' : assessment ? `Latest report notice · ${date}` : 'Choose an assessment file to read.'}</div>
    {error && <p className="assessment-error" role="status">{error}</p>}
    <button className="wide-action assessment-read" type="button" disabled={reading} onClick={() => fileInput.current?.click()}>{reading ? 'Reading assessment…' : 'Read latest assessment'} <span aria-hidden="true">↑</span></button>
    <input hidden ref={fileInput} type="file" accept=".docx,.txt,.md,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown" aria-label="Choose an assessment file" onChange={event => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; if (file) void selectFile(file); }}/>
    <p className="assessment-file-help">Word (.docx) or text (.txt). In Files, choose Browse → Google Drive → Training 4 Life → Assessments. iPhone chooses the starting folder.</p>
    <details className="assessment-file-options"><summary>Can’t find the report?</summary><p>Enable Google Drive in Files → Browse → More → Edit. For a Google Doc, use Google Docs’ Share &amp; export options to save a Word (.docx) copy first.</p><a href={FOLDER_URL} target="_blank" rel="noopener noreferrer">Open Assessments folder ↗</a>{assessment && <a href={assessmentUrl(assessment)} target="_blank" rel="noopener noreferrer">Open latest Google Doc ↗</a>}</details>
    {fileError && <p className="assessment-error" role="alert">{fileError}</p>}
    {selected && !opened && <button className="assessment-plan-link" type="button" onClick={showReader}>Reopen selected assessment ↓</button>}
    {selected && opened && <div id="assessment-reader" className="assessment-reader" ref={reader} tabIndex={-1}>
      <div className="assessment-reader-heading"><span className="kicker">SELECTED FILE</span><h3>{selected.name}</h3><p>Text read on this device. Choose your workouts after reviewing the report.</p><button type="button" className="assessment-plan-link" onClick={() => setOpened(false)}>Close report ↑</button></div>
      <article className="assessment-document" aria-label="Selected assessment contents">{selected.blocks.map((block, index) => block.kind === 'heading' ? <h4 key={index}>{block.text}</h4> : <p key={index}>{block.text}</p>)}</article>
      {assessment && <button className="wide-action" type="button" onClick={markRead}>Mark latest notice as read</button>}
      <button className="assessment-plan-link" type="button" onClick={() => { setOpened(false); const mapping = document.querySelector<HTMLDetailsElement>('.more-page .schedule-card'); if (mapping) { mapping.open = true; mapping.scrollIntoView({ block: 'start', behavior: 'smooth' }); mapping.querySelector<HTMLElement>('summary')?.focus({ preventScroll: true }); } }}>Choose my week’s workouts ↓</button>
    </div>}
    {notice && <p role="status">{notice}</p>}
    <div className="assessment-footer"><button type="button" onClick={() => refresh.current()} disabled={busy}>Check report notice</button><a href={FOLDER_URL} target="_blank" rel="noopener noreferrer">Assessments folder ↗</a></div>
    {assessment && <small className="assessment-sync-note">Drive checked {new Date(assessment.checkedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}. New report notices sync Sundays after 8 p.m.</small>}
  </section>;
}
