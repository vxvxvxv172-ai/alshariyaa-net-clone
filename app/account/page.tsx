"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuthStore } from "../store/authStore";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function resolveImg(src?: string | null) {
  if (!src) return null;
  return src.startsWith("http") ? src : `${API}${src}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus =
  | "pending" | "confirmed" | "processing" | "ready_to_ship"
  | "shipped" | "out_for_delivery" | "delivered" | "cancelled";

type OrderItem = {
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
};

type Order = {
  _id: string;
  orderId: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  statusHistory?: { status: string; changedAt: string; changedBy: string }[];
  createdAt: string;
  updatedAt?: string;
  installmentType?: "full" | "installment";
  months?: number;
  monthlyPayment?: number;
  downPayment?: number;
  customer?: string;
  whatsapp?: string;
  nationalId?: string;
  address?: string;
  shipping?: {
    companyName?: string;
    price?: number;
    isFree?: boolean;
    deliveryMinDays?: number;
    deliveryMaxDays?: number;
  };
  deliveryAddress?: { formattedAddress?: string };
};

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  pending:          "قيد المعالجة",
  confirmed:        "مؤكد",
  processing:       "جاري التجهيز",
  ready_to_ship:    "جاهز للشحن",
  shipped:          "تم الشحن",
  out_for_delivery: "خرج للتسليم",
  delivered:        "تم التسليم",
  cancelled:        "ملغي",
};

const STATUS_STYLE: Record<string, { badge: string }> = {
  pending:          { badge: "bg-amber-50 text-amber-600 border-amber-200" },
  confirmed:        { badge: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  processing:       { badge: "bg-orange-50 text-orange-600 border-orange-100" },
  ready_to_ship:    { badge: "bg-indigo-50 text-indigo-600 border-indigo-100" },
  shipped:          { badge: "bg-violet-50 text-violet-600 border-violet-100" },
  out_for_delivery: { badge: "bg-amber-50 text-amber-600 border-amber-100" },
  delivered:        { badge: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  cancelled:        { badge: "bg-red-50 text-red-500 border-red-100" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("ar-SA", {
      year: "numeric", month: "long", day: "numeric",
    });
  } catch {
    return iso;
  }
}

function fmtMoney(n: number) {
  return Number(n || 0).toLocaleString("ar-SA", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner({ sm }: { sm?: boolean }) {
  return (
    <span className={`border-2 border-[#0A1C29]/15 border-t-[#0A1C29] rounded-full animate-spin inline-block ${sm ? "w-4 h-4" : "w-6 h-6"}`} />
  );
}

// ─── OrderCard ────────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: Order }) {
  const st = STATUS_STYLE[order.status] ?? STATUS_STYLE.pending;
  const firstItem = order.items?.[0];
  const imgUrl = resolveImg(firstItem?.image);

  return (
    <Link
      href={`/account/orders/${order.orderId || order._id}`}
      className="block focus-visible:outline-none hover:bg-[#fafafa] transition-colors"
      aria-label={`طلب رقم ${order.orderId}`}
    >
      <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-gray-400">رقم الطلب</span>
          <span className="text-[13px] font-bold text-[#0A1C29] font-mono" dir="ltr">#{order.orderId}</span>
        </div>
        <div className="w-[52px] h-[52px] rounded-lg bg-[#f4f5f7] border border-[#ebebeb] flex items-center justify-center shrink-0">
          {imgUrl ? (
            <Image src={imgUrl} alt={firstItem?.name ?? "منتج"} width={52} height={52}
              className="object-contain w-full h-full p-1.5" loading="lazy" unoptimized />
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c8ccd4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          )}
        </div>
      </div>

      <div className="mx-4 border-t border-[#f0f0f0]" />

      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <span className="text-[14px] font-black text-[#0A1C29] tabular-nums">
          {fmtMoney(order.total)}
          <span className="text-[11px] font-medium text-[#9a9fa8] mr-1">ر.س</span>
        </span>
        <span className="text-[11px] text-[#b0b5be]">{fmtDate(order.createdAt)}</span>
      </div>

      <div className="flex items-center justify-between gap-2 px-4 pb-4">
        <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full border ${st.badge}`}>
          {STATUS_LABEL[order.status] ?? order.status}
        </span>
        <span className="text-[11px] font-semibold text-[#0A1C29] underline underline-offset-2">عرض التفاصيل</span>
      </div>
    </Link>
  );
}

// ─── InfoRow ──────────────────────────────────────────────────────────────────

function InfoRow({ label, value, ltr }: { label: string; value?: string; ltr?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-gray-400 font-medium">{label}</span>
      <span className="text-sm font-semibold text-[#0A1C29]" dir={ltr ? "ltr" : undefined}>{value || "—"}</span>
    </div>
  );
}

// ─── Main Inner ───────────────────────────────────────────────────────────────

function AccountPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, setUser, logout, initialized } = useAuthStore();

  const urlTab = searchParams.get("tab") === "orders" ? "orders" : "profile";
  const [tab, setTab] = useState<"profile" | "orders">(urlTab);

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [ordersFetched, setOrdersFetched] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Sync tab with URL
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "orders") setTab("orders");
    else if (t === "profile") setTab("profile");
  }, [searchParams]);

  useEffect(() => {
    if (initialized && !loading && !user) router.replace("/auth?redirect=/account");
  }, [initialized, loading, user, router]);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setPhone(user.phone || "");
      // Claim guest orders silently in background
      fetch("/api/account/orders/claim", { method: "POST" }).catch(() => {});
    }
  }, [user]);

  const fetchOrders = useCallback(async (pageNum = 1) => {
    setOrdersLoading(true);
    setOrdersError("");
    try {
      const res = await fetch(`/api/account/orders?page=${pageNum}&limit=10`);
      const data = await res.json();
      if (!res.ok) { setOrdersError(data.error || "حدث خطأ"); return; }
      setOrders(data.orders || []);
      setTotalPages(data.pages || 1);
      setPage(pageNum);
      setOrdersFetched(true);
    } catch {
      setOrdersError("حدث خطأ في تحميل الطلبات");
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "orders" && user && !ordersFetched && !ordersLoading) {
      fetchOrders(1);
    }
  }, [tab, user, ordersFetched, ordersLoading, fetchOrders]);

  const handleTabChange = (t: "profile" | "orders") => {
    setTab(t);
    router.replace(`/account?tab=${t}`, { scroll: false });
  };

  const handleSave = async () => {
    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    const cleanPhone = phone.replace(/\s/g, "");

    if (!cleanFirst || cleanFirst.length < 2) {
      setSaveError("الاسم الأول يجب أن يكون حرفين على الأقل");
      return;
    }
    if (!cleanLast || cleanLast.length < 2) {
      setSaveError("اسم العائلة يجب أن يكون حرفين على الأقل");
      return;
    }
    if (!cleanPhone) {
      setSaveError("أدخل رقم الجوال");
      return;
    }
    if (changePasswordOpen && newPassword) {
      if (newPassword.length < 6) {
        setSaveError("كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل");
        return;
      }
      if (!currentPassword) {
        setSaveError("أدخل كلمة المرور الحالية لتأكيد التغيير");
        return;
      }
    }

    setSaveError("");
    setSaveSuccess(false);
    setSaving(true);

    try {
      const payload: Record<string, string> = {
        firstName: cleanFirst,
        lastName: cleanLast,
        phone: cleanPhone,
      };

      if (changePasswordOpen && newPassword) {
        payload.newPassword = newPassword;
        payload.currentPassword = currentPassword;
      }

      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || "حدث خطأ، حاول مرة أخرى");
        return;
      }

      if (data.user) {
        setUser(data.user);
      }
      setEditing(false);
      setChangePasswordOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError("حدث خطأ، حاول مرة أخرى");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setSaveError("");
    setChangePasswordOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setPhone(user.phone || "");
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  if (!initialized || loading)
    return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;
  if (!user) return null;

  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "U";
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "مستخدم";

  return (
    <div className="min-h-screen flex flex-col items-center px-3 sm:px-4 py-8 sm:py-12" style={{ background: "#ffffff" }} dir="rtl">
      <div className="w-full max-w-[560px] space-y-3">

        {/* ── Hero ── */}
        <div className="border rounded-sm px-5 py-4 flex items-center gap-3" style={{ background: "var(--color-1)", borderColor: "var(--color-4)" }}>
          <div className="w-11 h-11 rounded-full border flex items-center justify-center text-base font-black shrink-0 select-none" style={{ background: "var(--color-4)", borderColor: "var(--color-4)", color: "#fff" }}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-black truncate" style={{ color: "var(--color-2)" }}>{displayName}</p>
            <p className="text-xs truncate mt-0.5" style={{ color: "var(--color-3)" }} dir="ltr">{user.email}</p>
          </div>
        </div>

        {/* ── Tabs container ── */}
        <div className="border rounded-sm overflow-hidden" style={{ background: "#ffffff", borderColor: "var(--color-4)" }}>

          {/* Tab headers */}
          <div className="flex border-b" style={{ borderColor: "var(--color-4)" }}>
            {(["profile", "orders"] as const).map((t) => (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                className="flex-1 py-3.5 text-sm font-semibold transition-colors border-b-2 -mb-px"
                style={tab === t
                  ? { borderColor: "var(--color-2)", color: "var(--color-2)" }
                  : { borderColor: "transparent", color: "var(--color-3)" }
                }
              >
                {t === "profile" ? "بياناتي" : "طلباتي"}
              </button>
            ))}
          </div>

          <div className="p-4 sm:p-5">

            {/* ── Profile ── */}
            {tab === "profile" && (
              <div className="space-y-5">
                {saveSuccess && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-sm">
                    <span className="text-green-500 text-base">✓</span> تم حفظ البيانات بنجاح
                  </div>
                )}
                {saveError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-sm">
                    {saveError}
                  </div>
                )}

                {!editing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 p-4 border rounded-sm" style={{ background: "var(--color-1)", borderColor: "var(--color-4)" }}>
                      <InfoRow label="الاسم الأول" value={user.firstName} />
                      <InfoRow label="اسم العائلة" value={user.lastName} />
                    </div>
                    <div className="p-4 border rounded-sm space-y-4" style={{ background: "var(--color-1)", borderColor: "var(--color-4)" }}>
                      <InfoRow label="البريد الإلكتروني" value={user.email} ltr />
                      <InfoRow label="رقم الجوال" value={user.phone || "—"} ltr />
                    </div>
                    <button
                      onClick={() => setEditing(true)}
                      className="w-full py-3 border text-sm font-semibold transition-colors rounded-sm"
                      style={{ borderColor: "var(--color-2)", color: "var(--color-2)" }}
                      onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = "var(--color-2)"; (e.target as HTMLButtonElement).style.color = "#fff"; }}
                      onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = "transparent"; (e.target as HTMLButtonElement).style.color = "var(--color-2)"; }}
                    >
                      تعديل البيانات
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label htmlFor="acc-fn" className="text-xs font-medium text-gray-500">الاسم الأول</label>
                        <input
                          id="acc-fn"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full px-3 py-2.5 border text-sm rounded-sm focus:outline-none transition-colors bg-white"
                          style={{ borderColor: "var(--color-4)", color: "var(--color-2)" }}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="acc-ln" className="text-xs font-medium text-gray-500">اسم العائلة</label>
                        <input
                          id="acc-ln"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full px-3 py-2.5 border text-sm rounded-sm focus:outline-none transition-colors bg-white"
                          style={{ borderColor: "var(--color-4)", color: "var(--color-2)" }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-500">البريد الإلكتروني</label>
                      <div className="w-full px-3 py-2.5 border text-sm select-none rounded-sm" style={{ background: "var(--color-1)", borderColor: "var(--color-4)", color: "var(--color-3)" }} dir="ltr">
                        {user.email}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="acc-phone" className="text-xs font-medium text-gray-500">رقم الجوال</label>
                      <input
                        id="acc-phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        dir="ltr"
                        inputMode="tel"
                        className="w-full px-3 py-2.5 border text-sm rounded-sm focus:outline-none transition-colors bg-white"
                        style={{ borderColor: "var(--color-4)", color: "var(--color-2)" }}
                      />
                    </div>

                    {/* Change password toggle */}
                    <div className="pt-2 border-t" style={{ borderColor: "var(--color-4)" }}>
                      <button
                        type="button"
                        onClick={() => setChangePasswordOpen(!changePasswordOpen)}
                        className="text-xs font-semibold hover:underline"
                        style={{ color: "var(--color-2)" }}
                      >
                        {changePasswordOpen ? "إلغاء تغيير كلمة المرور" : "تغيير كلمة المرور؟"}
                      </button>

                      {changePasswordOpen && (
                        <div className="mt-3 space-y-3 p-3 bg-gray-50 border rounded-sm" style={{ borderColor: "var(--color-4)" }}>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-600">كلمة المرور الحالية</label>
                            <input
                              type="password"
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full px-3 py-2 border text-sm rounded-sm focus:outline-none bg-white"
                              style={{ borderColor: "var(--color-4)" }}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-600">كلمة المرور الجديدة</label>
                            <input
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="6 أحرف على الأقل"
                              className="w-full px-3 py-2 border text-sm rounded-sm focus:outline-none bg-white"
                              style={{ borderColor: "var(--color-4)" }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 py-3 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2 rounded-sm"
                        style={{ background: "var(--color-2)" }}
                      >
                        {saving ? <Spinner sm /> : "حفظ التعديلات"}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={saving}
                        className="px-4 py-3 border text-sm transition-colors rounded-sm"
                        style={{ borderColor: "var(--color-4)", color: "var(--color-3)" }}
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-[#f0f0f0]">
                  <button
                    onClick={handleLogout}
                    className="w-full py-3 text-sm font-semibold text-red-500 border border-red-100 hover:bg-red-50 transition-colors rounded-sm"
                  >
                    تسجيل الخروج
                  </button>
                </div>
              </div>
            )}

            {/* ── Orders ── */}
            {tab === "orders" && (
              <div>
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#f0f0f0]">
                  <span className="text-xs text-gray-400 font-medium">قائمة طلباتك</span>
                  <button
                    onClick={() => fetchOrders(page)}
                    disabled={ordersLoading}
                    className="text-xs font-semibold text-[#0A1C29] hover:underline disabled:opacity-40 flex items-center gap-1"
                  >
                    {ordersLoading ? <Spinner sm /> : "تحديث الطلبات ⟳"}
                  </button>
                </div>

                {ordersLoading && (
                  <div className="flex justify-center py-14"><Spinner /></div>
                )}
                {ordersError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-sm mb-3">
                    {ordersError}
                  </div>
                )}
                {!ordersLoading && !ordersError && ordersFetched && orders.length === 0 && (
                  <div className="text-center py-16 space-y-2">
                    <p className="text-4xl">🛍️</p>
                    <p className="text-sm font-bold text-[#0A1C29]">لا توجد طلبات حاليًا</p>
                    <p className="text-xs text-gray-400">طلباتك ستظهر هنا بعد إتمام الشراء</p>
                  </div>
                )}
                {orders.length > 0 && (
                  <div className="flex flex-col divide-y divide-[#f0f0f0]">
                    {orders.map((order) => (
                      <OrderCard key={order._id || order.orderId} order={order} />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 pt-4 mt-2 border-t border-[#f0f0f0]">
                    <button
                      onClick={() => fetchOrders(page - 1)}
                      disabled={page <= 1 || ordersLoading}
                      className="px-3 py-1.5 border rounded-sm text-xs font-semibold disabled:opacity-40 hover:bg-gray-50 transition"
                      style={{ borderColor: "var(--color-4)", color: "var(--color-2)" }}
                    >
                      السابق
                    </button>
                    <span className="text-xs font-medium text-gray-500">صفحة {page} من {totalPages}</span>
                    <button
                      onClick={() => fetchOrders(page + 1)}
                      disabled={page >= totalPages || ordersLoading}
                      className="px-3 py-1.5 border rounded-sm text-xs font-semibold disabled:opacity-40 hover:bg-gray-50 transition"
                      style={{ borderColor: "var(--color-4)", color: "var(--color-2)" }}
                    >
                      التالي
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <span className="w-6 h-6 border-2 border-[#0A1C29]/15 border-t-[#0A1C29] rounded-full animate-spin inline-block" />
        </div>
      }
    >
      <AccountPageInner />
    </Suspense>
  );
}
