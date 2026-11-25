import { getPublishedPortal } from "@/lib/admissions/publicPortal";
import ClosedParentPortal from "@/components/admissions/ClosedParentPortal";
import PublicEnquiryForm from "@/components/admissions/PublicEnquiryForm";
export const dynamic="force-dynamic";
export const metadata={title:"Parent admission enquiry",robots:{index:false,follow:false}};
export default async function EnquirePage(){
  const portal=await getPublishedPortal();
  if(!portal)return <ClosedParentPortal/>;
  return <PublicEnquiryForm school={portal.school} academicYear={portal.year} siteKey={portal.siteKey} policy={portal.policy} fees={portal.fees}/>;
}
