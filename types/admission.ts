export type Admission = {
  enquiryNo: string;
  student: string;
  parent: string;
  admClass: string;
  mobile: string;
  dob: string;
  age?: string;
  eligible?: string;

  application?: string;
  applicationSubmitted?: string;
  entrance?: string;
  interview?: string;
  finalAdmission?: string;
};