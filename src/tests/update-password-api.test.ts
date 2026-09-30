import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "../app/api/auth/update-password/route";


const { mockGetUser, mockUpdateUser } = vi.hoisted(() => ({
    mockGetUser: vi.fn(),
    mockUpdateUser: vi.fn(),
}));

vi.mock("../lib/supabase/server", () => ({
    createClient: vi.fn(async () => ({
        auth: {
            getUser: mockGetUser,
            updateUser: mockUpdateUser,
        },
    })),
}));

describe("POST /api/auth/update-password", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("updates the password for an authenticated user", async () => {
        mockGetUser.mockResolvedValue({
            data: {
                user: {
                    id: "user-123",
                },
            },
            error: null,
        });

        mockUpdateUser.mockResolvedValue({
            data: {
                user: {
                    id: "user-123",
                },
            },
            error: null,
        });

        const request = new Request(
            "http://localhost:3000/api/auth/update-password",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    password: "new-password-123",
                }),
            }
        );

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({
            success: true,
        });

        expect(mockUpdateUser).toHaveBeenCalledWith({
            password: "new-password-123",
        });
    });

    it("returns 400 when password is missing", async () => {
        const request = new Request(
            "http://localhost:3000/api/auth/update-password",
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
            error: "Password is required.",
        });

        expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it("returns 400 when password is too short", async () => {
        const request = new Request(
            "http://localhost:3000/api/auth/update-password",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
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

        expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it("returns 401 when there is no authenticated user", async () => {
        mockGetUser.mockResolvedValue({
            data: {
                user: null,
            },
            error: null,
        });

        const request = new Request(
            "http://localhost:3000/api/auth/update-password",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    password: "new-password-123",
                }),
            }
        );

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body).toEqual({
            error: "Unauthorized.",
        });

        expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it("returns 500 when Supabase cannot update the password", async () => {
        mockGetUser.mockResolvedValue({
            data: {
                user: {
                    id: "user-123",
                },
            },
            error: null,
        });

        mockUpdateUser.mockResolvedValue({
            data: {
                user: null,
            },
            error: {
                message: "Password update failed",
            },
        });

        const request = new Request(
            "http://localhost:3000/api/auth/update-password",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    password: "new-password-123",
                }),
            }
        );

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body).toEqual({
            error: "Unable to update password.",
        });
    });

    it("returns 500 for malformed JSON", async () => {
        const request = new Request(
            "http://localhost:3000/api/auth/update-password",
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
            error: "Unable to update password.",
        });
    });
});