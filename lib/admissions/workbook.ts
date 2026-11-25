/** Small, dependency-free OOXML writer. All text uses inline strings (never formulas). */
type Cell=string|number|null|undefined;
type Sheet={name:string;rows:Cell[][]};
const encoder=new TextEncoder();
const xml=(value:string)=>value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g,"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
function col(index:number){let s="";for(let n=index+1;n>0;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;}
function crc32(bytes:Uint8Array){let crc=0xffffffff;for(const b of bytes){crc^=b;for(let k=0;k<8;k++)crc=(crc>>>1)^(0xedb88320&-(crc&1));}return (crc^0xffffffff)>>>0;}
function join(parts:Uint8Array[]){const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let offset=0;for(const part of parts){out.set(part,offset);offset+=part.length;}return out;}
function zip(entries:{path:string;content:string}[]){
  const local:Uint8Array[]=[],central:Uint8Array[]=[];let offset=0;
  for(const entry of entries){
    const name=encoder.encode(entry.path),data=encoder.encode(entry.content),crc=crc32(data);
    const l=new Uint8Array(30+name.length),v=new DataView(l.buffer);
    v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint16(12,33,true);v.setUint32(14,crc,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,name.length,true);l.set(name,30);
    const c=new Uint8Array(46+name.length),cv=new DataView(c.buffer);
    cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x800,true);cv.setUint16(14,33,true);cv.setUint32(16,crc,true);cv.setUint32(20,data.length,true);cv.setUint32(24,data.length,true);cv.setUint16(28,name.length,true);cv.setUint32(42,offset,true);c.set(name,46);
    local.push(l,data);central.push(c);offset+=l.length+data.length;
  }
  const directory=join(central),end=new Uint8Array(22),e=new DataView(end.buffer);
  e.setUint32(0,0x06054b50,true);e.setUint16(8,entries.length,true);e.setUint16(10,entries.length,true);e.setUint32(12,directory.length,true);e.setUint32(16,offset,true);
  return join([...local,directory,end]);
}
const ns="http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const rel="http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const pkg="http://schemas.openxmlformats.org/package/2006/relationships";
const declaration='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
function sheetXml(rows:Cell[][]){
  const width=Math.max(1,...rows.slice(0,1).map(row=>row.length)),last=col(width-1)+Math.max(1,rows.length);
  return declaration+'<worksheet xmlns="'+ns+'"><dimension ref="A1:'+last+'"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="17"/><cols>'+Array.from({length:width},(_,i)=>'<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+(i===1||i===2?30:19)+'" customWidth="1"/>').join("")+'</cols><sheetData>'+rows.map((row,i)=>'<row r="'+(i+1)+'">'+row.map((value,j)=>{
    const ref=col(j)+(i+1),style=i===0?' s="1"':"";
    if(typeof value==="number"&&Number.isFinite(value))return '<c r="'+ref+'"'+style+'><v>'+value+'</v></c>';
    return '<c r="'+ref+'"'+style+' t="inlineStr"><is><t xml:space="preserve">'+xml(String(value??"").slice(0,32767))+'</t></is></c>';
  }).join("")+'</row>').join("")+'</sheetData>'+(rows.length>1?'<autoFilter ref="A1:'+last+'"/>':"")+'</worksheet>';
}
export function createWorkbook(sheets:Sheet[]){
  if(!sheets.length||sheets.length>10||sheets.some(s=>s.rows.length>10001))throw Error("Workbook limits exceeded");
  const types=declaration+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+sheets.map((_,i)=>'<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join("")+'</Types>';
  const styles=declaration+'<styleSheet xmlns="'+ns+'"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF3730A3"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
  return zip([
    {path:"[Content_Types].xml",content:types},
    {path:"_rels/.rels",content:declaration+'<Relationships xmlns="'+pkg+'"><Relationship Id="rId1" Type="'+rel+'/officeDocument" Target="xl/workbook.xml"/></Relationships>'},
    {path:"xl/workbook.xml",content:declaration+'<workbook xmlns="'+ns+'" xmlns:r="'+rel+'"><bookViews><workbookView/></bookViews><sheets>'+sheets.map((s,i)=>'<sheet name="'+xml(s.name.slice(0,31).replace(/[\[\]:*?\\/]/g," "))+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>').join("")+'</sheets></workbook>'},
    {path:"xl/_rels/workbook.xml.rels",content:declaration+'<Relationships xmlns="'+pkg+'">'+sheets.map((_,i)=>'<Relationship Id="rId'+(i+1)+'" Type="'+rel+'/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>').join("")+'<Relationship Id="rId'+(sheets.length+1)+'" Type="'+rel+'/styles" Target="styles.xml"/></Relationships>'},
    {path:"xl/styles.xml",content:styles},...sheets.map((s,i)=>({path:"xl/worksheets/sheet"+(i+1)+".xml",content:sheetXml(s.rows)}))
  ]);
}
