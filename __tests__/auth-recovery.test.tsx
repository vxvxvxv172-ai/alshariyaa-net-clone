import React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import AuthPage from "../app/auth/page";

jest.mock("next/navigation", () => {
  const React = require("react");
  const navigate = (url: string) => { window.history.pushState({}, "", url); window.dispatchEvent(new Event("popstate")); };
  const router = { push: jest.fn(navigate), replace: jest.fn(navigate) };
  return {
    useRouter: () => router,
    useSearchParams: () => {
      const query = React.useSyncExternalStore((cb: () => void) => { window.addEventListener("popstate", cb); return () => window.removeEventListener("popstate", cb); }, () => window.location.search);
      return React.useMemo(() => new URLSearchParams(query), [query]);
    },
  };
});
jest.mock("next/image", () => ({ __esModule: true, default: () => null }));
jest.mock("../app/lib/useTikTokEvents", () => ({ identify: jest.fn(), track: jest.fn() }));
jest.mock("../app/store/authStore", () => ({ useAuthStore: () => ({ user: null, initialized: true, setUser: jest.fn() }) }));
const email = "recovery@example.invalid";
beforeEach(() => {
  window.history.replaceState({}, "", "/auth"); sessionStorage.clear();
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, cooldown: 60 }) });
});
afterEach(cleanup);
async function startRecovery() {
  fireEvent.click(screen.getByRole("button", { name: "نسيت كلمة السر؟" }));
  fireEvent.change(screen.getByLabelText("البريد الإلكتروني"), { target: { value: email } });
  fireEvent.click(screen.getByRole("button", { name: "إرسال رمز التحقق" }));
  await screen.findByText("تحقق من بريدك الإلكتروني");
}
test("email entry survives refresh and switching registration tabs", async () => {
  let view = render(<AuthPage />);
  fireEvent.click(await screen.findByRole("button", { name: "نسيت كلمة السر؟" }));
  fireEvent.change(screen.getByLabelText("البريد الإلكتروني"), { target: { value: email } });
  view.unmount(); view = render(<AuthPage />);
  expect(await screen.findByText("نسيت كلمة المرور؟")).toBeVisible();
  expect(screen.getByLabelText("البريد الإلكتروني")).toHaveValue(email);
  fireEvent.click(screen.getByRole("button", { name: "إنشاء حساب", exact: true }));
  fireEvent.click(screen.getByRole("button", { name: "تسجيل الدخول", exact: true }));
  expect(screen.getByText("نسيت كلمة المرور؟")).toBeVisible();
});
test("OTP step survives refresh without storing password or OTP", async () => {
  const view = render(<AuthPage />); await startRecovery();
  fireEvent.change(screen.getByLabelText("الرقم 1 من رمز التحقق"), { target: { value: "١٢٣٤٥٦" } });
  for (let i = 1; i <= 6; i++) expect(screen.getByLabelText(`الرقم ${i} من رمز التحقق`)).toHaveValue(String(i));
  fireEvent.change(screen.getByLabelText("كلمة المرور الجديدة"), { target: { value: " secret42 " } });
  expect(sessionStorage.getItem("auth_forgot_draft")).not.toContain("secret42");
  expect(sessionStorage.getItem("auth_forgot_draft")).not.toContain("123456");
  view.unmount(); render(<AuthPage />);
  expect(await screen.findByText("تحقق من بريدك الإلكتروني")).toBeVisible();
  expect(screen.getByLabelText("كلمة المرور الجديدة")).toHaveValue("");
  expect(screen.getByLabelText("الرقم 1 من رمز التحقق")).toHaveValue("");
  expect(fetch).toHaveBeenCalledTimes(1);
});
test("successful recovery returns to login with correct email and empty password", async () => {
  render(<AuthPage />); await startRecovery();
  fireEvent.change(screen.getByLabelText("الرقم 1 من رمز التحقق"), { target: { value: "۱۲۳۴۵۶" } });
  fireEvent.change(screen.getByLabelText("كلمة المرور الجديدة"), { target: { value: " secret42 " } });
  fireEvent.click(screen.getByRole("button", { name: "تغيير كلمة المرور", exact: true }));
  await screen.findByText("تم تغيير كلمة المرور");
  const body = JSON.parse((fetch as jest.Mock).mock.calls[1][1].body);
  expect(body.newPassword).toBe(" secret42 "); expect(body.otp).toBe("123456");
  fireEvent.click(screen.getByRole("button", { name: "العودة لتسجيل الدخول" }));
  expect(screen.getByLabelText("البريد الإلكتروني")).toHaveValue(email);
  expect(screen.getByLabelText("كلمة المرور", { exact: true })).toHaveValue("");
});
test("server lock disables verification and survives remount", async () => {
  const view = render(<AuthPage />); await startRecovery();
  (fetch as jest.Mock).mockResolvedValueOnce({ ok: false, json: async () => ({ error: "انتظر", code: "MAX_ATTEMPTS", cooldown: 300 }) });
  fireEvent.change(screen.getByLabelText("الرقم 1 من رمز التحقق"), { target: { value: "123456" } });
  fireEvent.change(screen.getByLabelText("كلمة المرور الجديدة"), { target: { value: "secret42" } });
  fireEvent.click(screen.getByRole("button", { name: "تغيير كلمة المرور", exact: true }));
  await waitFor(() => expect(screen.getByLabelText("الرقم 1 من رمز التحقق")).toBeDisabled());
  view.unmount(); render(<AuthPage />);
  await waitFor(() => expect(screen.getByLabelText("الرقم 1 من رمز التحقق")).toBeDisabled());
});
