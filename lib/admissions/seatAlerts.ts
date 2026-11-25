import type { Prisma } from "@/src/generated/prisma/client";
import { capacityKey,type SchoolClass } from "@/lib/admissions/yearPolicy";
import { seatCapacitySchema } from "@/lib/admissions/yearPolicySchema";
import { queueAdminAlert } from "@/lib/notifications/events";
export async function alertReleasedSeat(tx:Prisma.TransactionClient,record:{id:string;academicYear:string;admClass:string;updatedAt:Date},event:string){
  const config=await tx.admissionConfig.findUnique({where:{key:capacityKey(record.academicYear)}});
  if(!config)return [];
  const parsed=seatCapacitySchema.safeParse(JSON.parse(config.value));
  if(!parsed.success)return [];
  const className=record.admClass.trim().toUpperCase() as SchoolClass;
  const capacity=parsed.data[className];
  if(capacity===undefined)return [];
  const filter={academicYear:record.academicYear,admClass:{equals:record.admClass,mode:"insensitive" as const}};
  const [admitted,waiting]=await Promise.all([tx.admission.count({where:{...filter,finalAdmission:"ADMITTED"}}),tx.admissionCase.count({where:{waitlistedAt:{not:null},admission:{...filter,finalAdmission:"PENDING"}}})]);
  if(!waiting||admitted>=capacity)return [];
  return queueAdminAlert(tx,{type:"SEAT_AVAILABLE",eventKey:"seat:"+record.id+":"+event+":"+record.updatedAt.toISOString(),title:"Seat available",body:"Class "+className+" · "+record.academicYear+" has an available seat and waiting-list enquiries.",href:"/admissions/operations"});
}
