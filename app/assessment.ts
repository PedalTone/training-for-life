export type AssessmentNotice = { version: 1; fileId: string; modifiedAt: string; checkedAt: string };
export function validateAssessment(value: unknown): AssessmentNotice | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  if (item.version !== 1 || typeof item.fileId !== 'string' || !/^[A-Za-z0-9_-]{15,150}$/.test(item.fileId)) return null;
  if (typeof item.modifiedAt !== 'string' || !Number.isFinite(Date.parse(item.modifiedAt)) || typeof item.checkedAt !== 'string' || !Number.isFinite(Date.parse(item.checkedAt))) return null;
  return { version: 1, fileId: item.fileId, modifiedAt: item.modifiedAt, checkedAt: item.checkedAt };
}
export function assessmentRevision(item: AssessmentNotice) { return `${item.fileId}:${item.modifiedAt}`; }
export function assessmentUrl(item: AssessmentNotice, preview = false) {
  return `https://docs.google.com/document/d/${encodeURIComponent(item.fileId)}/${preview ? 'preview' : 'edit'}`;
}
