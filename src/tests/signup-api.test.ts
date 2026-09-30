import { beforeEach, describe, expect, test, vi } from "vitest";
import { POST } from "../app/api/auth/signup/route";


const { mockSignUp } = vi.hoisted(() => ({
    mockSignUp: vi.fn(),
}));

vi.mock("../lib/supabase/server", () => ({
    createClient: vi.fn(async () => ({
        auth: {
            signUp: mockSignUp,
        },
    })),
}));

describe("POST /api/auth/signup", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockSignUp.mockResolvedValue({
            data: {
                user: { id: "test-user-id" },
                session: null,
            },
            error: null,
        });
    });

    test("creates an account", async () => {
        const request = new Request(
            "http://localhost/api/auth/signup",
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

        expect(response.status).toBe(201);

        expect(mockSignUp).toHaveBeenCalledWith({
            email: "student@example.com",
            password: "password123",
        });

        expect(body).toEqual({
            success: true,
            requiresEmailConfirmation: true,
        });
    });

    test("returns 400 when email is missing", async () => {
        const request = new Request(
            "http://localhost/api/auth/signup",
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
        expect(mockSignUp).not.toHaveBeenCalled();
    });

    test("returns 400 when password is missing", async () => {
        const request = new Request(
            "http://localhost/api/auth/signup",
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
        expect(mockSignUp).not.toHaveBeenCalled();
    });

    test("returns 400 when password is too short", async () => {
        const request = new Request(
            "http://localhost/api/auth/signup",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: "student@example.com",
                    password: "short",
                }),
            }
        );

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(400);

        expect(body).toEqual({
            error: "Password must be at least 8 characters.",
        });

        expect(mockSignUp).not.toHaveBeenCalled();
    });

    test("returns 400 when Supabase rejects signup", async () => {
        mockSignUp.mockResolvedValue({
            data: {
                user: null,
                session: null,
            },
            error: {
                message: "User already registered",
            },
        });

        const request = new Request(
            "http://localhost/api/auth/signup",
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

        expect(response.status).toBe(400);
        expect(body).toEqual({
            error: "User already registered",
        });
    });

    test("returns 500 for invalid request JSON", async () => {
        const request = new Request(
            "http://localhost/api/auth/signup",
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
        expect(mockSignUp).not.toHaveBeenCalled();
    });
});