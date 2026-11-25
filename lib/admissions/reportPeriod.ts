const DAY=86400000,IST=19800000;
export function indiaDate(now=new Date()){return new Date(now.getTime()+IST).toISOString().slice(0,10);}
export function dayStart(date:string){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return null;
  const utc=new Date(date+"T00:00:00Z");
  if(!Number.isFinite(utc.getTime())||utc.toISOString().slice(0,10)!==date)return null;
  return new Date(utc.getTime()-IST);
}
export function reportPeriod(from:string,to:string){
  const start=dayStart(from),last=dayStart(to);
  if(!start||!last||last<start||last.getTime()-start.getTime()>=366*DAY)return null;
  return {start,end:new Date(last.getTime()+DAY),days:Math.round((last.getTime()-start.getTime())/DAY)+1};
}
export function previousWeek(now=new Date()){
  const today=indiaDate(now),start=dayStart(today)!;
  const day=new Date(start.getTime()+IST).getUTCDay();
  const monday=new Date(start.getTime()-((day+6)%7)*DAY);
  const previous=new Date(monday.getTime()-7*DAY);
  return {start:previous,end:monday,from:indiaDate(previous),to:indiaDate(new Date(monday.getTime()-DAY))};
}
export function targetKey(year:string,date:string){return "dailyTarget:"+year+":"+date;}
