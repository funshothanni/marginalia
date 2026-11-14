import { expect, test } from "vitest";
import { parseCourseSubject } from "../lib/courseSubject";

test.each([
    [" cs 101 ", "CS 101", "CS", "101"],
    ["comp2000", "COMP 2000", "COMP", "2000"],
    ["mat 012", "MAT 012", "MAT", "012"],
])("normalizes %s as %s", (input, subject, course, code) => {
    expect(parseCourseSubject(input)).toEqual({ subject, course, code });
});

test.each(["COMP", "C 101", "COMPS 101", "CS 10", "CS 10000", "CS 10A"])(
    "rejects invalid subject %s",
    (input) => expect(parseCourseSubject(input)).toBeNull()
);
