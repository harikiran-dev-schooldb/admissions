import { getLatestAcademicYear } from "@/lib/academicYears";

export const ADMISSION_SETTINGS_KEY = "schooldb.admissions.settings";
export const ADMISSION_SETTINGS_EVENT = "schooldb:admission-settings";

export type AdmissionSettings = { ageAsOfDate: string };

export function getDefaultAgeAsOfDate(academicYear = getLatestAcademicYear()) {
  return `${academicYear.slice(0, 4)}-06-01`;
}

export const defaultAdmissionSettings: AdmissionSettings = {
  ageAsOfDate: getDefaultAgeAsOfDate(),
};
