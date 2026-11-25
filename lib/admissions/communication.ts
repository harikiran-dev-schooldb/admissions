type RecordInfo={enquiryNo:string;admClass:string;academicYear:string;finalAdmission:string;entranceScheduledAt?:Date|string|null;interviewScheduledAt?:Date|string|null};
export const TEMPLATE_TYPES=["ACKNOWLEDGEMENT","APPLICATION","ENTRANCE","INTERVIEW","FEES","CONFIRMATION"] as const;
export type TemplateType=typeof TEMPLATE_TYPES[number];
const date=(value:Date|string)=>new Date(value).toLocaleString("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"});
export function parentMessage(type:TemplateType, record:RecordInfo, school:string):string|null{
  const ref="Enquiry "+record.enquiryNo+" · Class "+record.admClass+" · "+record.academicYear+".";
  const start="Dear Parent, ";
  const end=" Thank you, "+school+" admission office.";
  switch(type){
    case "ACKNOWLEDGEMENT":return start+"thank you for your enquiry. "+ref+end;
    case "APPLICATION":return start+"please contact the admission office regarding the application for "+ref+end;
    case "ENTRANCE":return record.entranceScheduledAt?start+"the entrance appointment is scheduled for "+date(record.entranceScheduledAt)+" (IST). "+ref+end:null;
    case "INTERVIEW":return record.interviewScheduledAt?start+"the interview is scheduled for "+date(record.interviewScheduledAt)+" (IST). "+ref+end:null;
    case "FEES":return start+"please contact the admission office for the current approved fee quotation. "+ref+end;
    case "CONFIRMATION":return record.finalAdmission==="ADMITTED"?start+"we are pleased to confirm the admission recorded by the school. "+ref+end:null;
  }
}
export function whatsappContact(value:string){const number=value.replace(/\D/g,"");return /^[6-9]\d{9}$/.test(number)?"91"+number:/^91[6-9]\d{9}$/.test(number)?number:null;}
