import { getPublishedPortal } from "@/lib/admissions/publicPortal";
import PublicEnquiryForm from "@/components/admissions/PublicEnquiryForm";
export const dynamic="force-dynamic";
export const metadata={title:"Parent admission enquiry",robots:{index:false,follow:false}};
export default async function EnquirePage(){
  const portal=await getPublishedPortal();
  if(!portal)return <main className="mx-auto max-w-xl p-6 sm:p-12"><section className="premium-panel rounded-[24px] p-6"><h1 className="text-2xl font-black">Online admission enquiries</h1><p className="mt-3 text-sm leading-6 text-slate-600">Online enquiries are not currently open. Please contact the school admission office.</p></section></main>;
  return <PublicEnquiryForm school={portal.school} academicYear={portal.year} siteKey={portal.siteKey} policy={portal.policy} fees={portal.fees}/>;
}
