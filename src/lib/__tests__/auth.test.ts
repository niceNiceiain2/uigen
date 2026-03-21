// @vitest-environment node
import { vi, test, expect, beforeEach, describe } from "vitest";
import { SignJWT } from "jose";

vi.mock("server-only", () => ({}));

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

const JWT_SECRET = new TextEncoder().encode("development-secret-key");
const COOKIE_NAME = "auth-token";

async function makeToken(payload: object, expiresIn = "7d") {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresIn)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createSession", () => {
  test("sets an httpOnly cookie with a signed JWT", async () => {
    const { createSession } = await import("@/lib/auth");
    await createSession("user-123", "test@example.com");

    expect(mockCookieStore.set).toHaveBeenCalledOnce();
    const [name, , options] = mockCookieStore.set.mock.calls[0];
    expect(name).toBe(COOKIE_NAME);
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
    expect(options.expires).toBeInstanceOf(Date);
  });

  test("token expires approximately 7 days from now", async () => {
    const { createSession } = await import("@/lib/auth");
    const before = Date.now();
    await createSession("user-123", "test@example.com");
    const after = Date.now();

    const [, , options] = mockCookieStore.set.mock.calls[0];
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    expect(options.expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
    expect(options.expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
  });
});

describe("getSession", () => {
  test("returns null when no cookie is present", async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    expect(session).toBeNull();
  });

  test("returns session payload for a valid token", async () => {
    const payload = { userId: "user-123", email: "test@example.com", expiresAt: new Date() };
    const token = await makeToken(payload);
    mockCookieStore.get.mockReturnValue({ value: token });

    const { getSession } = await import("@/lib/auth");
    const session = await getSession();

    expect(session).not.toBeNull();
    expect(session?.userId).toBe("user-123");
    expect(session?.email).toBe("test@example.com");
  });

  test("returns null for a tampered token", async () => {
    mockCookieStore.get.mockReturnValue({ value: "invalid.token.value" });
    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    expect(session).toBeNull();
  });

  test("returns null for an expired token", async () => {
    const payload = { userId: "user-123", email: "test@example.com" };
    const token = await new SignJWT({ ...payload })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("0s")
      .setIssuedAt()
      .sign(JWT_SECRET);

    mockCookieStore.get.mockReturnValue({ value: token });
    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    expect(session).toBeNull();
  });
});

describe("deleteSession", () => {
  test("deletes the auth cookie", async () => {
    const { deleteSession } = await import("@/lib/auth");
    await deleteSession();
    expect(mockCookieStore.delete).toHaveBeenCalledOnce();
    expect(mockCookieStore.delete).toHaveBeenCalledWith(COOKIE_NAME);
  });
});

describe("verifySession", () => {
  test("returns null when no cookie is present in the request", async () => {
    const { NextRequest } = await import("next/server");
    const { verifySession } = await import("@/lib/auth");

    const request = new NextRequest("http://localhost/");
    const session = await verifySession(request);
    expect(session).toBeNull();
  });

  test("returns session payload for a valid token in the request", async () => {
    const { NextRequest } = await import("next/server");
    const { verifySession } = await import("@/lib/auth");

    const payload = { userId: "user-456", email: "hello@example.com", expiresAt: new Date() };
    const token = await makeToken(payload);

    const request = new NextRequest("http://localhost/", {
      headers: { cookie: `${COOKIE_NAME}=${token}` },
    });
    const session = await verifySession(request);

    expect(session).not.toBeNull();
    expect(session?.userId).toBe("user-456");
    expect(session?.email).toBe("hello@example.com");
  });

  test("returns null for an invalid token in the request", async () => {
    const { NextRequest } = await import("next/server");
    const { verifySession } = await import("@/lib/auth");

    const request = new NextRequest("http://localhost/", {
      headers: { cookie: `${COOKIE_NAME}=bad.token.here` },
    });
    const session = await verifySession(request);
    expect(session).toBeNull();
  });

  test("returns null for an expired token in the request", async () => {
    const { NextRequest } = await import("next/server");
    const { verifySession } = await import("@/lib/auth");

    const payload = { userId: "user-456", email: "hello@example.com" };
    const token = await new SignJWT({ ...payload })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("0s")
      .setIssuedAt()
      .sign(JWT_SECRET);

    const request = new NextRequest("http://localhost/", {
      headers: { cookie: `${COOKIE_NAME}=${token}` },
    });
    const session = await verifySession(request);
    expect(session).toBeNull();
  });
});
