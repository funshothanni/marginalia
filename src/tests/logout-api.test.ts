import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSignOut } = vi.hoisted(() => ({
    mockSignOut: vi.fn(),
}));

vi.mock("../lib/supabase/server", () => ({
    createClient: vi.fn(async () => ({
        auth: {
            signOut: mockSignOut,
        },
    })),
}));

import { POST } from "../app/api/auth/logout/route";

describe("POST /api/auth/logout", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("signs the user out successfully", async () => {
        mockSignOut.mockResolvedValue({
            error: null,
        });

        const response = await POST();
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({
            success: true,
        });

        expect(mockSignOut).toHaveBeenCalledTimes(1);
    });

    it("returns 500 when Supabase signOut fails", async () => {
        mockSignOut.mockResolvedValue({
            error: {
                message: "Sign out failed",
            },
        });

        const response = await POST();
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({
            error: "Unable to sign out.",
        });
    });

    it("returns 500 when an unexpected error occurs", async () => {
        mockSignOut.mockRejectedValue(
            new Error("Unexpected failure")
        );

        const response = await POST();
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({
            error: "Unable to sign out.",
        });
    });
});