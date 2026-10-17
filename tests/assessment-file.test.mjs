import test from 'node:test';
import assert from 'node:assert/strict';
import { zipSync, strToU8 } from 'fflate';
import { textAssessmentBlocks, validateAssessmentDocument, readAssessmentFile, MAX_ASSESSMENT_FILE } from '../app/assessment-file.ts';
test('assessment text preserves complete paragraphs, lines, Unicode and literal markup', () => {
  const text='\uFEFF# Weekly review\r\n\r\n• Mobility & recovery\r\n• Strength 2×\r\n\r\n<script>literal text</script>';
  assert.deepEqual(textAssessmentBlocks(text),[{kind:'heading',text:'Weekly review'},{kind:'paragraph',text:'• Mobility & recovery\n• Strength 2×'},{kind:'paragraph',text:'<script>literal text</script>'}]);
  assert.throws(()=>textAssessmentBlocks(' \n '),/no readable text/);
  assert.throws(()=>textAssessmentBlocks('binary\0data'),/not a readable text/);
  assert.throws(()=>textAssessmentBlocks('a'.repeat(200001)),/too long/);
});
test('saved report validation rejects malformed or oversized data and strips extra fields', () => {
  const doc={version:1,name:'review.txt',importedAt:'2026-10-16T23:00:00Z',blocks:[{kind:'paragraph',text:'Keep original report text'}]};
  assert.deepEqual(validateAssessmentDocument({...doc,extra:'discard'}),doc);
  for(const value of [null,{}, {...doc,blocks:[]},{...doc,blocks:[{kind:'html',text:'test'}]},{...doc,blocks:[{kind:'paragraph',text:'a'.repeat(200001)}]},{...doc,importedAt:'bad'},{...doc,name:''}]) assert.equal(validateAssessmentDocument(value),null);
});
test('file reading supports text exports and gives useful errors without changing storage', async () => {
  assert.equal((await readAssessmentFile(new File(['Full assessment\n\nSecond paragraph'],'assessment.txt'))).blocks[1].text,'Second paragraph');
  const utf16=new Uint8Array([255,254,65,0,66,0]);
  assert.equal((await readAssessmentFile(new File([utf16],'assessment.txt'))).blocks[0].text,'AB');
  await assert.rejects(readAssessmentFile(new File([''],'empty.txt')),/empty/);
  await assert.rejects(readAssessmentFile(new File(['{}'],'report.gdoc')),/Google Docs link/);
  await assert.rejects(readAssessmentFile(new File(['pdf'],'report.pdf')),/Word/);
  await assert.rejects(readAssessmentFile(new File(['x'.repeat(MAX_ASSESSMENT_FILE+1)],'large.txt')),/5 MB/);
  await assert.rejects(readAssessmentFile(new File(['not a zip'],'bad.docx')),/could not be read/);
  const wrong=zipSync({'not-a-doc.txt':strToU8('wrong')});await assert.rejects(readAssessmentFile(new File([wrong],'wrong.docx')),/valid Word/);
  const oversized=zipSync({'word/document.xml':strToU8('a'.repeat(2*1024*1024+1))});await assert.rejects(readAssessmentFile(new File([oversized],'large.docx')),/could not be read/);
});
