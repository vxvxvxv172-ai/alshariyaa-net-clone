"use client";

import React from "react";
import { Clock, CheckCircle2, Package, Truck, XCircle } from "lucide-react";

export type OrderTrackerStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "ready_to_ship"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

interface OrderTrackerProps {
  status: OrderTrackerStatus;
  orderId?: string;
  createdAt?: string;
  compact?: boolean;
}

export function OrderTracker({ status, orderId, compact = false }: OrderTrackerProps) {
  if (status === "cancelled") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 text-right" dir="rtl">
        <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
          <XCircle className="w-5 h-5 shrink-0" />
          <span>تم إلغاء هذا الطلب</span>
        </div>
        <p className="text-xs text-red-500 mt-1 mr-7">
          إذا كانت لديك أي استفسارات، يرجى التواصل مع خدمة العملاء عبر الواتساب.
        </p>
      </div>
    );
  }

  // 4 main stages for customers:
  // 1. Pending (قيد المراجعة والتدقيق)
  // 2. Confirmed (تم تأكيد الطلب من الإدارة)
  // 3. Processing / Shipped (جاري التجهيز والشحن)
  // 4. Delivered (تم التوصيل والاستلام)
  const getStepIndex = (st: OrderTrackerStatus): number => {
    switch (st) {
      case "pending":
        return 1;
      case "confirmed":
        return 2;
      case "processing":
      case "ready_to_ship":
      case "shipped":
      case "out_for_delivery":
        return 3;
      case "delivered":
        return 4;
      default:
        return 1;
    }
  };

  const currentStep = getStepIndex(status);

  const steps = [
    {
      num: 1,
      title: "قيد المراجعة",
      desc: "جاري مراجعة الطلب",
      icon: Clock,
    },
    {
      num: 2,
      title: "تم تأكيد الطلب",
      desc: "تم الاعتماد من الإدارة",
      icon: CheckCircle2,
    },
    {
      num: 3,
      title: "جاري التجهيز والشحن",
      desc: status === "shipped" || status === "out_for_delivery" ? "تم الشحن مع المندوب" : "قيد تجهيز الشريحة",
      icon: status === "shipped" || status === "out_for_delivery" ? Truck : Package,
    },
    {
      num: 4,
      title: "تم التسليم",
      desc: "تم استلام الطلب بنجاح",
      icon: CheckCircle2,
    },
  ];

  if (compact) {
    const activeStepInfo = steps[currentStep - 1] || steps[0];
    const isPending = status === "pending";
    const isConfirmed = status === "confirmed";

    return (
      <div className="w-full bg-[#f8fafc] border border-gray-100 rounded-xl p-3" dir="rtl">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isPending
                  ? "bg-amber-500 animate-ping"
                  : isConfirmed
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-blue-500"
              }`}
            />
            <span className="text-xs font-black text-[#0A1C29]">
              حالة الطلب:{" "}
              <span
                className={
                  isPending
                    ? "text-amber-600"
                    : isConfirmed
                    ? "text-emerald-600"
                    : "text-blue-600"
                }
              >
                {activeStepInfo.title}
              </span>
            </span>
          </div>
          <span className="text-[11px] font-bold text-gray-400">
            مرحلة {currentStep} من 4
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden flex">
          <div
            className={`h-full transition-all duration-700 rounded-full ${
              currentStep === 1
                ? "bg-amber-500 w-1/4"
                : currentStep === 2
                ? "bg-emerald-500 w-2/4"
                : currentStep === 3
                ? "bg-indigo-500 w-3/4"
                : "bg-emerald-600 w-full"
            }`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-b from-white to-[#fbfcfe] border border-[#e2e8f0] rounded-2xl p-4 sm:p-5 shadow-sm" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#0A1C29]/5 flex items-center justify-center text-[#0A1C29]">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-[#0A1C29]">مراحل تتبع الطلب</h4>
            {orderId && (
              <p className="text-[11px] text-gray-400 font-mono" dir="ltr">
                #{orderId}
              </p>
            )}
          </div>
        </div>

        {/* Current status badge */}
        <div>
          {status === "pending" && (
            <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200/80 px-2.5 py-1 rounded-full text-xs font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              قيد المراجعة
            </span>
          )}
          {status === "confirmed" && (
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-1 rounded-full text-xs font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              تم تأكيد الطلب ✓
            </span>
          )}
          {(status === "processing" || status === "ready_to_ship" || status === "shipped" || status === "out_for_delivery") && (
            <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-2.5 py-1 rounded-full text-xs font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              جاري التجهيز والشحن
            </span>
          )}
          {status === "delivered" && (
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-full text-xs font-bold shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              تم التسليم
            </span>
          )}
        </div>
      </div>

      {/* Stepper Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative">
        {steps.map((st) => {
          const isDone = currentStep > st.num;
          const isCurrent = currentStep === st.num;
          const isUpcoming = currentStep < st.num;
          const Icon = st.icon;

          return (
            <div
              key={st.num}
              className={`relative rounded-xl p-3 border transition-all ${
                isCurrent
                  ? "bg-white border-[#0A1C29] shadow-sm ring-2 ring-[#0A1C29]/10"
                  : isDone
                  ? "bg-emerald-50/40 border-emerald-200/80"
                  : "bg-gray-50/60 border-gray-100 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    isCurrent
                      ? "bg-[#0A1C29] text-white"
                      : isDone
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                <span className="text-[10px] font-bold text-gray-400">
                  خطوة {st.num}
                </span>
              </div>

              <p
                className={`text-xs font-black leading-tight ${
                  isCurrent
                    ? "text-[#0A1C29]"
                    : isDone
                    ? "text-emerald-900"
                    : "text-gray-500"
                }`}
              >
                {st.title}
              </p>
              <p className="text-[10px] text-gray-400 mt-1 line-clamp-1 leading-tight">
                {st.desc}
              </p>

              {/* Status pulse dot for current step */}
              {isCurrent && (
                <div className="absolute top-2 left-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default OrderTracker;
