export function generateEnquiryNo(lastNo: number) {
  return `ENQ${String(lastNo + 1).padStart(5, "0")}`;
}