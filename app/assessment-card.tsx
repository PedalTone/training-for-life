"use client";

import { useEffect } from 'react';

export function AssessmentCard() {
  useEffect(() => {
    // Retire only the former assessment reader's copies and read-status cache.
    // Reports remain in Drive; workout history and backups are untouched.
    for (const key of ['t4l:assessment-document', 't4l:assessment-notice', 't4l:assessment-read']) {
      try { localStorage.removeItem(key); } catch { /* The folder link also works without browser storage. */ }
    }
  }, []);

  return <a className="settings-card assessment-card assessment-read" href="https://drive.google.com/drive/folders/1YJ98Xnn-ET46O70_xYzYqy1rkZQX0PbQ" target="_blank" rel="noopener noreferrer">
    <span className="setting-icon data" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6M8 17v-3m4 3v-6m4 6v-4"/></svg></span>
    <span><strong>Training Assessment</strong><small>Read the latest report on Google Drive from Grok.</small></span>
    <span className="assessment-external" aria-hidden="true">↗</span>
  </a>;
}
