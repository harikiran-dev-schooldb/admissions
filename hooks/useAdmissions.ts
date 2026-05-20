"use client";

import {
  useEffect,
  useState,
} from "react";

export function useAdmissions() {
  const [students, setStudents] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  async function loadAdmissions() {
    try {
      const res = await fetch(
        "/api/admissions"
      );

      const json = await res.json();

      setStudents(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdmissions();
  }, []);

  return {
    students,
    loading,
    reload: loadAdmissions,
  };
}