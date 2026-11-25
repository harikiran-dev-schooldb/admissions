"use client";
import AdminCentreShell from "@/components/admissions/AdminCentreShell";
import ActiveYearPicker from "@/components/admissions/ActiveYearPicker";
import ManagementReport from "@/components/admissions/ManagementReport";
export default function ReportsPage(){return <AdminCentreShell title="Management reports"><ActiveYearPicker>{year=><ManagementReport key={year} year={year}/>}</ActiveYearPicker></AdminCentreShell>;}
