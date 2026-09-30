import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "../app/api/auth/forgot-password/route";

const { mockResetPasswordForEmail } = vi.hoisted(() => ({
    mockResetPasswordForEmail: vi.fn(),
}));

vi.mock("../lib/supabase/server", () => ({
    createClient: vi.fn(async () => ({
        auth: {
            resetPasswordForEmail: mockResetPasswordForEmail,
        },
    })),
}));

describe("POST /api/auth/forgot-password", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("sends a password reset email", async () => {
        mockResetPasswordForEmail.mockResolvedValue({
            error: null,
        });

        const request = new Request(
            "http://localhost:3000/api/auth/forgot-password",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: "user@example.com",
                }),
            }
        );

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(200);

        expect(body).toEqual({
            success: true,
            message:
                "If an account exists for that email, a password reset link has been sent.",
        });

        expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
            "user@example.com",
            {
                redirectTo:
                    "http://localhost:3000/auth/reset-password",
            }
        );
    });

    it("returns 400 when email is missing", async () => {
        const request = new Request(
            "http://localhost:3000/api/auth/forgot-password",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({}),
            }
        );

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({
            error: "Email is required.",
        });

        expect(
            mockResetPasswordForEmail
        ).not.toHaveBeenCalled();
    });

    it("returns 500 when Supabase fails", async () => {
        mockResetPasswordForEmail.mockResolvedValue({
            error: {
                message: "Reset failed",
            },
        });

        const request = new Request(
            "http://localhost:3000/api/auth/forgot-password",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: "user@example.com",
                }),
            }
        );

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({
            error: "Unable to send password reset email.",
        });
    });

    it("returns 500 for malformed JSON", async () => {
        const request = new Request(
            "http://localhost:3000/api/auth/forgot-password",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: "{bad json",
            }
        );

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({
            error: "Unable to send password reset email.",
        });
    });
});