import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "../app/auth/reset-password/route";

const { mockVerifyOtp } = vi.hoisted(() => ({
    mockVerifyOtp: vi.fn(),
}));

vi.mock("../lib/supabase/server", () => ({
    createClient: vi.fn(async () => ({
        auth: {
            verifyOtp: mockVerifyOtp,
        },
    })),
}));

describe("GET /auth/reset-password", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("verifies the recovery token and redirects to the reset password page", async () => {
        mockVerifyOtp.mockResolvedValue({
            error: null,
        });

        const request = new Request(
            "http://localhost:3000/auth/reset-password?token_hash=test-token&type=recovery"
        );

        const response = await GET(request as never);

        expect(mockVerifyOtp).toHaveBeenCalledWith({
            token_hash: "test-token",
            type: "recovery",
        });

        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toBe(
            "http://localhost:3000/reset-password"
        );
    });

    it("rejects a request without a token", async () => {
        const request = new Request(
            "http://localhost:3000/auth/reset-password?type=recovery"
        );

        const response = await GET(request as never);

        expect(mockVerifyOtp).not.toHaveBeenCalled();

        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toBe(
            "http://localhost:3000/login?error=invalid_recovery_link"
        );
    });

    it("rejects an incorrect OTP type", async () => {
        const request = new Request(
            "http://localhost:3000/auth/reset-password?token_hash=test-token&type=email"
        );

        const response = await GET(request as never);

        expect(mockVerifyOtp).not.toHaveBeenCalled();

        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toBe(
            "http://localhost:3000/login?error=invalid_recovery_link"
        );
    });

    it("redirects to login when verification fails", async () => {
        mockVerifyOtp.mockResolvedValue({
            error: {
                message: "Token has expired",
            },
        });

        const request = new Request(
            "http://localhost:3000/auth/reset-password?token_hash=bad-token&type=recovery"
        );

        const response = await GET(request as never);

        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toBe(
            "http://localhost:3000/login?error=password_recovery_failed"
        );
    });
});