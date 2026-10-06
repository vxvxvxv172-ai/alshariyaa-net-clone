import { normalizeOtp, safeAuthRedirect } from "../app/lib/authUx";

test.each(["١٢٣٤٥٦", "۱۲۳۴۵۶", "123456", "رمزك: ١٢٣ ٤٥٦"])("normalizes OTP %s", input => {
  expect(normalizeOtp(input)).toBe("123456");
});
test.each([null, "//evil.example", "/auth", "/auth?redirect=/auth", "/%61uth", "/\\evil.example", "https://evil.example"])("rejects unsafe or recursive return %s", value => {
  expect(safeAuthRedirect(value)).toBe("/account");
});
test("preserves orders tab and anchor", () => {
  expect(safeAuthRedirect("/account?tab=orders#order")).toBe("/account?tab=orders#order");
});
