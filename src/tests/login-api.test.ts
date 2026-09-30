import { POST } from "../app/api/auth/login/route";
import { beforeEach, describe, expect, test, vi } from "vitest";

const { mockSignInWithPassword } = vi.hoisted(() => ({
    mockSignInWithPassword: vi.fn(),
}));

vi.mock("../lib/supabase/server", () => ({
    createClient: vi.fn(async () => ({
        auth: {
            signInWithPassword: mockSignInWithPassword,
        },
    })),
}));

describe("POST /api/auth/login", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockSignInWithPassword.mockResolvedValue({
            data: {
                user: { id: "test-user-id" },
                session: {},
            },
            error: null,
        });
    });

    test("signs in with email and password", async () => {
        const request = new Request(
            "http://localhost/api/auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: "student@example.com",
                    password: "password123",
                }),
            }
        );

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({
            success: true,
        });

        expect(mockSignInWithPassword).toHaveBeenCalledWith({
            email: "student@example.com",
            password: "password123",
        });
    });

    test("returns 400 when email is missing", async () => {
        const request = new Request(
            "http://localhost/api/auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    password: "password123",
                }),
            }
        );

        const response = await POST(request);

        expect(response.status).toBe(400);
        expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });

    test("returns 400 when password is missing", async () => {
        const request = new Request(
            "http://localhost/api/auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: "student@example.com",
                }),
            }
        );

        const response = await POST(request);

        expect(response.status).toBe(400);
        expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });

    test("returns 401 when credentials are invalid", async () => {
        mockSignInWithPassword.mockResolvedValue({
            data: {
                user: null,
                session: null,
            },
            error: {
                message: "Invalid login credentials",
            },
        });

        const request = new Request(
            "http://localhost/api/auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: "student@example.com",
                    password: "wrong-password",
                }),
            }
        );

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body).toEqual({
            error: "Invalid email or password.",
        });
    });

    test("returns 500 for invalid request JSON", async () => {
        const request = new Request(
            "http://localhost/api/auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: "{invalid-json",
            }
        );

        const response = await POST(request);

        expect(response.status).toBe(500);
        expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });
});