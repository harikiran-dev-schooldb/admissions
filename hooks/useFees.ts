"use client";
import { useCallback,useEffect,useState } from "react";
import type { FeeRecord } from "@/src/generated/prisma/client";
async function loadFees():Promise<FeeRecord[]>{const res=await fetch("/api/fees",{cache:"no-store"});const json=await res.json();if(!res.ok)throw new Error(json.error||"Failed to load fee structures");return json.data??[]}
export function useFees(){
 const [fees,setFees]=useState<FeeRecord[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState("");
 const reload=useCallback(async()=>{try{setLoading(true);setError("");setFees(await loadFees())}catch(err){setError(err instanceof Error?err.message:"Failed to load fee structures")}finally{setLoading(false)}},[]);
 useEffect(()=>{let active=true;loadFees().then(data=>{if(active)setFees(data)}).catch((err:unknown)=>{if(active)setError(err instanceof Error?err.message:"Failed to load fee structures")}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[]);
 return{fees,loading,error,reload};
}
