import { beforeEach, describe, expect, test, vi } from "vitest";

const {
    mockGetSubjects,
    mockGetCurrentUser,
} = vi.hoisted(() => ({
    mockGetSubjects: vi.fn(),
    mockGetCurrentUser: vi.fn(),
}));

vi.mock("../lib/db", () => ({
    getSubjects: mockGetSubjects,
}));

vi.mock("../lib/auth", () => ({
    getCurrentUser: mockGetCurrentUser,
}));

import { GET } from "../app/api/subjects/route";

beforeEach(() => {
    vi.clearAllMocks();

    mockGetCurrentUser.mockResolvedValue({
        id: "test-user-id",
    });
});

describe("GET /api/subjects", () => {
    test("returns subjects belonging to the authenticated user", async () => {
        mockGetSubjects.mockResolvedValueOnce([
            "COMP",
            "PSYC",
        ]);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);

        expect(mockGetSubjects).toHaveBeenCalledWith(
            "test-user-id"
        );

        expect(data).toEqual({
            subjects: ["COMP", "PSYC"],
        });
    });

    test("returns 401 when the user is not authenticated", async () => {
        mockGetCurrentUser.mockResolvedValueOnce(null);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(401);

        expect(data).toEqual({
            error: "Unauthorized",
        });

        expect(mockGetSubjects).not.toHaveBeenCalled();
    });

    test("returns 500 when retrieving subjects fails", async () => {
        mockGetSubjects.mockRejectedValueOnce(
            new Error("Database unavailable")
        );

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);

        expect(data).toEqual({
            error: "Failed to retrieve subjects",
        });
    });
});