"use client";

import { useEffect, useState } from "react";
import { Admission } from "../types/admission";
import { fetchAdmissions } from "../services/admissions.service";



export function useAdmissions() {
  const [students, setStudents] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const data = await fetchAdmissions();
      setStudents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return {
    students,
    setStudents,
    loading,
  };
}