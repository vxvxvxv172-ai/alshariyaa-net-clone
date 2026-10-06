"use client";

import { useEffect } from "react";
import { useAuthStore } from "../../store/authStore";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { fetchMe, sessionError } = useAuthStore();
  useEffect(() => {
    void fetchMe();
    const retry = () => { void fetchMe(true); };
    const timer = setInterval(() => {
      if (useAuthStore.getState().sessionError) retry();
    }, 30000);
    window.addEventListener("online", retry);
    window.addEventListener("focus", retry);
    return () => {
      clearInterval(timer);
      window.removeEventListener("online", retry);
      window.removeEventListener("focus", retry);
    };
  }, [fetchMe]);
  return <>
    {sessionError && <div role="status" dir="rtl" className="bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
      {sessionError} <button className="mr-2 underline" onClick={() => void fetchMe(true)}>إعادة المحاولة</button>
    </div>}
    {children}
  </>;
}
