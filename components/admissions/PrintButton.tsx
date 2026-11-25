"use client";
export default function PrintButton(){return <button type="button" className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white print:hidden" onClick={()=>window.print()}>Print / Save PDF</button>;}
