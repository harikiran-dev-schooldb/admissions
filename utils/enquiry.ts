export function generateEnquiryNo(
  latestNumber: number
) {
  const next = latestNumber + 1;

  return `ENQ-2026-${next}`;
}