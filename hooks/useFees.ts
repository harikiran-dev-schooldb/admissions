"use client";

import { useEffect, useState } from "react";

export function useFees() {
  const [fees, setFees] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  async function fetchFees() {
    try {
      const res = await fetch("/api/fees");

      const data = await res.json();

      setFees(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFees();
  }, []);

  return {
    fees,
    loading,
    reload: fetchFees,
  };
}