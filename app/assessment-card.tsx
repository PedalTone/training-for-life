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
    <span><strong>Training Assessment</strong><small>Read the latest report in Google Drive.</small></span>
    <span className="assessment-external" aria-hidden="true">↗</span>
  </a>;
}
