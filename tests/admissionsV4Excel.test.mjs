import test from "node:test";
import assert from "node:assert/strict";
import { parseImportCsv } from "../lib/admissions/importCsv.ts";
import { createWorkbook } from "../lib/admissions/workbook.ts";
import { readFileSync } from "node:fs";
test("CSV template handles BOM, CRLF and quoted commas, rejects bad columns",()=>{
  const rows=parseImportCsv('\uFEFFstudent,parent,mobile,dob,admClass,source\r\n"Child, A","Parent A",9876543210,2020-01-01,i,walk_in\r\n');
  assert.equal(rows[0].input.student,"Child, A");assert.equal(rows[0].input.admClass,"I");assert.equal(rows[0].input.source,"WALK_IN");
  assert.throws(()=>parseImportCsv("student,parent\nA,B"),/template/);assert.throws(()=>parseImportCsv('student,parent,mobile,dob,admClass\n"unclosed'),/Unclosed/);
});
test("XLSX is ZIP-based and untrusted values are strings, not formulas",()=>{
  const bytes=createWorkbook([{name:"Admissions",rows:[["Name","Mobile"],["=1+1","0987654321"],["<&",1]]}]);
  assert.equal(new DataView(bytes.buffer).getUint32(0,true),0x04034b50);
  const text=new TextDecoder().decode(bytes);assert.match(text,/xl\/workbook.xml/);assert.match(text,/t="inlineStr"/);assert.match(text,/=1\+1/);assert.match(text,/&lt;&amp;/);assert.doesNotMatch(text,/<f>/);
});
test("import preview and exports are admin-only; preview never creates records",()=>{
 const api=readFileSync("app/api/admissions/import-preview/route.ts","utf8"),exportApi=readFileSync("app/api/admissions/export/route.ts","utf8");
 assert.match(api,/requireAccess\("admin"\)/);assert.match(exportApi,/requireAccess\("admin"\)/);assert.doesNotMatch(api,/\.create\(/);assert.match(api,/isDuplicateEnquiry/);
});
