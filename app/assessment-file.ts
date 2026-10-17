export type AssessmentBlock = { kind: 'heading' | 'paragraph'; text: string };
export type AssessmentDocument = { version: 1; name: string; importedAt: string; blocks: AssessmentBlock[] };
export const MAX_ASSESSMENT_FILE = 5 * 1024 * 1024;
const MAX_XML = 2 * 1024 * 1024, MAX_TEXT = 200_000;
const WORD_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

export function validateAssessmentDocument(value: unknown): AssessmentDocument | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  if (item.version !== 1 || typeof item.name !== 'string' || !item.name.trim() || item.name.length > 255 || typeof item.importedAt !== 'string' || !Number.isFinite(Date.parse(item.importedAt)) || !Array.isArray(item.blocks) || !item.blocks.length || item.blocks.length > 10_000) return null;
  let length = 0; const blocks: AssessmentBlock[] = [];
  for (const block of item.blocks) {
    if (!block || !['heading', 'paragraph'].includes(block.kind) || typeof block.text !== 'string' || !block.text.trim()) return null;
    length += block.text.length; if (length > MAX_TEXT) return null;
    blocks.push({ kind: block.kind, text: block.text });
  }
  return { version: 1, name: item.name, importedAt: item.importedAt, blocks };
}

export function textAssessmentBlocks(text: string): AssessmentBlock[] {
  if (text.length > MAX_TEXT) throw new Error('That assessment is too long. Choose a report with fewer than 200,000 characters.');
  if (text.includes('\0')) throw new Error('This is not a readable text file. Choose a Word (.docx) or text (.txt) export.');
  const blocks: AssessmentBlock[] = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split(/\n\s*\n/).map(value => value.trim()).filter(Boolean).map(value => /^#{1,6}\s+[^\n]+$/.test(value) ? { kind: 'heading', text: value.replace(/^#{1,6}\s+/, '') } : { kind: 'paragraph', text: value });
  if (!blocks.length) throw new Error('That file has no readable text. Choose a Word or text export of the assessment.');
  return blocks;
}

export function wordAssessmentBlocks(xml: string): AssessmentBlock[] {
  if (xml.length > MAX_XML || /<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('That Word file could not be read safely. Export the assessment as plain text instead.');
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length || !doc.getElementsByTagNameNS(WORD_NS, 'body').length) throw new Error('That Word file is damaged. Export it again from Google Docs.');
  const blocks: AssessmentBlock[] = [];
  // Render only plain text. Relationships, images, scripts and external links are never loaded.
  for (const paragraph of Array.from(doc.getElementsByTagNameNS(WORD_NS, 'p'))) {
    let text = '';
    const walk = (node: Element) => {
      if (node.namespaceURI === WORD_NS) {
        if (node.localName === 'del') return;
        if (node.localName === 't') { text += node.textContent || ''; return; }
        if (node.localName === 'tab') { text += '\t'; return; }
        if (node.localName === 'br' || node.localName === 'cr') { text += '\n'; return; }
      }
      for (const child of Array.from(node.children)) walk(child);
    };
    walk(paragraph); text = text.trim(); if (!text) continue;
    const style = paragraph.getElementsByTagNameNS(WORD_NS, 'pStyle')[0]?.getAttributeNS(WORD_NS, 'val') || '';
    if (paragraph.getElementsByTagNameNS(WORD_NS, 'numPr').length) text = `• ${text}`;
    blocks.push({ kind: /^(heading\d*|title|subtitle)$/i.test(style) ? 'heading' : 'paragraph', text });
  }
  if (!blocks.length) throw new Error('No readable text was found. Choose a text export; images and scanned pages cannot be read here.');
  if (blocks.length > 10_000 || blocks.reduce((length, block) => length + block.text.length, 0) > MAX_TEXT) throw new Error('That assessment is too long. Choose a shorter report.');
  return blocks;
}

export async function readAssessmentFile(file: File): Promise<AssessmentDocument> {
  if (!file.size) throw new Error('That file is empty. Choose another assessment.');
  if (file.size > MAX_ASSESSMENT_FILE) throw new Error('Choose an assessment smaller than 5 MB.');
  const extension = file.name.split('.').at(-1)?.toLowerCase();
  let blocks: AssessmentBlock[];
  if (extension === 'docx') {
    const { unzipSync, strFromU8 } = await import('fflate');
    let xml: Uint8Array | undefined;
    try {
      const files = unzipSync(new Uint8Array(await file.arrayBuffer()), { filter: entry => {
        if (entry.name !== 'word/document.xml') return false;
        if (entry.originalSize > MAX_XML) throw new Error('oversized XML');
        return true;
      } });
      xml = files['word/document.xml'];
    } catch { throw new Error('That Word file could not be read. Export the assessment as Word (.docx) or plain text again.'); }
    if (!xml || xml.byteLength > MAX_XML) throw new Error('Choose a valid Word (.docx) assessment file.');
    blocks = wordAssessmentBlocks(strFromU8(xml));
  } else if (extension === 'txt' || extension === 'md') {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const encoding = bytes[0] === 255 && bytes[1] === 254 ? 'utf-16le' : bytes[0] === 254 && bytes[1] === 255 ? 'utf-16be' : 'utf-8';
    let text: string;
    try { text = new TextDecoder(encoding, { fatal: true }).decode(bytes); }
    catch { throw new Error('That text file uses an unreadable encoding. Save it as UTF-8 text or choose the Word export.'); }
    blocks = textAssessmentBlocks(text);
  } else if (extension === 'gdoc') {
    throw new Error('This is a Google Docs link, not the report text. In Google Docs, export the assessment as Word (.docx), then choose that file.');
  } else {
    throw new Error('Choose a Word (.docx) or text (.txt) assessment. In Google Docs, use Share & export to save a Word copy first.');
  }
  return { version: 1, name: file.name.slice(0, 255), importedAt: new Date().toISOString(), blocks };
}
