/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET as me } from "../app/api/auth/me/route";
import { POST as logout } from "../app/api/auth/logout/route";
import { POST as login } from "../app/api/auth/login-password/route";
import { POST as verify } from "../app/api/auth/forgot/verify/route";
beforeEach(() => { global.fetch = jest.fn(); });
const request = (body: object) => new NextRequest("http://localhost/api/auth", { method: "POST", body: JSON.stringify(body) });
test("session timeout returns retryable error instead of unauthenticated success", async () => {
  (fetch as jest.Mock).mockRejectedValue(new Error("timeout"));
  const res = await me(new NextRequest("http://localhost/api/auth/me", { headers: { cookie: "customer_token=test" } }));
  expect(res.status).toBe(503); expect(await res.json()).not.toHaveProperty("authenticated", false);
});
test("invalid session is distinct from service outage", async () => {
  (fetch as jest.Mock).mockResolvedValue(new Response("{}", { status: 401 }));
  const res = await me(new NextRequest("http://localhost/api/auth/me", { headers: { cookie: "customer_token=test" } }));
  expect(await res.json()).toEqual({ authenticated: false });
});
test("logout clears cookie without requiring backend availability", async () => {
  const res = await logout();
  expect(res.cookies.get("customer_token")?.value).toBe("");
  expect(res.headers.get("set-cookie")).toContain("Max-Age=0");
  expect(fetch).not.toHaveBeenCalled();
});
test("login forwards exact password", async () => {
  (fetch as jest.Mock).mockResolvedValue(new Response(JSON.stringify({ user: {} })));
  await login(request({ email: "test@example.invalid", password: " secret42 " }));
  expect(JSON.parse((fetch as jest.Mock).mock.calls[0][1].body).password).toBe(" secret42 ");
});
test("reset forwards exact password", async () => {
  (fetch as jest.Mock).mockResolvedValue(new Response(JSON.stringify({ success: true })));
  await verify(request({ email: "test@example.invalid", otp: "123456", newPassword: " secret42 " }));
  expect(JSON.parse((fetch as jest.Mock).mock.calls[0][1].body).newPassword).toBe(" secret42 ");
});
