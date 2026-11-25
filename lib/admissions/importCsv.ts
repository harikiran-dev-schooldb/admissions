/** Excel-compatible UTF-8 CSV, including quoted fields and CRLF. */
export const IMPORT_COLUMNS=["student","parent","mobile","dob","admClass","source"] as const;
export type ImportInput=Record<typeof IMPORT_COLUMNS[number],string>;
export type CsvRow={line:number;input:ImportInput};
export function parseImportCsv(text:string):CsvRow[]{
  if(text.length>300000)throw Error("CSV exceeds the 300 KB limit.");
  const matrix:string[][]=[];let row:string[]=[],field="",quoted=false,closed=false;
  const finishField=()=>{row.push(field);field="";closed=false;if(row.length>20)throw Error("Too many CSV columns.");};
  const finishRow=()=>{finishField();if(row.some(v=>v.trim()))matrix.push(row);row=[];if(matrix.length>101)throw Error("Import up to 100 enquiries at a time.");};
  const value=text.replace(/^\uFEFF/,"");
  for(let i=0;i<value.length;i++){
    const ch=value[i];
    if(quoted){if(ch==='"'){if(value[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else field+=ch;continue;}
    if(ch==='"'){if(field||closed)throw Error("Invalid quote in CSV.");quoted=true;continue;}
    if(ch===","){finishField();continue;}
    if(ch==="\r"||ch==="\n"){if(ch==="\r"&&value[i+1]==="\n")i++;finishRow();continue;}
    if(closed)throw Error("Invalid text after a quoted CSV field.");
    field+=ch;
  }
  if(quoted)throw Error("Unclosed CSV quoted field.");
  if(field||closed||row.length)finishRow();
  const header=matrix.shift()?.map(v=>v.trim().toLowerCase())??[];
  const required=IMPORT_COLUMNS.filter(v=>v!=="source");
  if(new Set(header).size!==header.length||required.some(v=>!header.includes(v.toLowerCase())))throw Error("Use the template: student,parent,mobile,dob,admClass,source.");
  if(header.some(v=>!IMPORT_COLUMNS.some(column=>column.toLowerCase()===v)))throw Error("Unexpected column. Use the template and remove extra columns.");
  if(!matrix.length)throw Error("No enquiry rows found.");
  return matrix.map((cells,index)=>{
    if(cells.length!==header.length)throw Error("CSV record "+(index+2)+" has the wrong number of fields.");
    const input=Object.fromEntries(IMPORT_COLUMNS.map(key=>[key,cells[header.indexOf(key.toLowerCase())]?.trim()??""])) as ImportInput;
    input.source=input.source.toUpperCase()||"UNSPECIFIED";input.admClass=input.admClass.toUpperCase();
    return {line:index+2,input};
  });
}
