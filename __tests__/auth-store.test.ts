import { useAuthStore } from "../app/store/authStore";
const user = { email: "test@example.invalid", firstName: "Test", lastName: "User" };
const response = (data: object, ok = true) => ({ ok, json: async () => data });
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear();
  useAuthStore.getState().setUser(null);
  useAuthStore.setState({ initialized: false, loading: true, sessionError: "", loggingOut: false });
  global.fetch = jest.fn();
});
test("recovers a valid cookie session without local cache", async () => {
  (fetch as jest.Mock).mockResolvedValue(response({ authenticated: true, user }));
  await useAuthStore.getState().fetchMe();
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(useAuthStore.getState().user).toEqual(user);
});
test("transient server failure keeps cached user and allows retry", async () => {
  localStorage.setItem("auth_user_cache", JSON.stringify(user));
  (fetch as jest.Mock).mockResolvedValueOnce(response({}, false)).mockResolvedValueOnce(response({ authenticated: true, user }));
  await useAuthStore.getState().fetchMe();
  expect(useAuthStore.getState().user).toEqual(user);
  expect(useAuthStore.getState().sessionError).not.toBe("");
  await useAuthStore.getState().fetchMe(true);
  expect(useAuthStore.getState().sessionError).toBe("");
});
test("failed logout preserves the session and surfaces an error", async () => {
  useAuthStore.getState().setUser(user);
  (fetch as jest.Mock).mockRejectedValue(new Error("offline"));
  await expect(useAuthStore.getState().logout()).rejects.toThrow();
  expect(useAuthStore.getState().user).toEqual(user);
  expect(localStorage.getItem("auth_user_cache")).not.toBeNull();
  expect(useAuthStore.getState().loggingOut).toBe(false);
});
test("successful logout clears session and drafts", async () => {
  useAuthStore.getState().setUser(user);
  sessionStorage.setItem("auth_forgot_draft", "draft");
  (fetch as jest.Mock).mockResolvedValue(response({ ok: true }));
  await useAuthStore.getState().logout();
  expect(useAuthStore.getState().user).toBeNull();
  expect(sessionStorage.getItem("auth_forgot_draft")).toBeNull();
});
test("confirmed unauthenticated response clears stale cache", async () => {
  localStorage.setItem("auth_user_cache", JSON.stringify(user));
  (fetch as jest.Mock).mockResolvedValue(response({ authenticated: false }));
  await useAuthStore.getState().fetchMe();
  expect(useAuthStore.getState().user).toBeNull();
  expect(useAuthStore.getState().sessionError).toBe("");
});
test("cross-tab logout does not send another logout request", () => {
  useAuthStore.getState().setUser(user);
  window.dispatchEvent(new StorageEvent("storage", { key: "auth_user_cache", newValue: null }));
  expect(useAuthStore.getState().user).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
});
test("session response started before logout cannot restore user", async () => {
  let finish: (value: unknown) => void = () => {};
  (fetch as jest.Mock).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; })).mockResolvedValueOnce(response({ ok: true }));
  const pending = useAuthStore.getState().fetchMe();
  await useAuthStore.getState().logout();
  finish(response({ authenticated: true, user }));
  await pending;
  expect(useAuthStore.getState().user).toBeNull();
});
