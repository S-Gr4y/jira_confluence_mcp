import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  listMacros,
  replaceParagraphTextPreservingMacros,
  validateStorage
} from "../src/atlassian/confluence-storage.js";

const fixture = readFileSync("tests/fixtures/confluence-macro-page.xml", "utf8");

describe("Confluence storage macro handling", () => {
  it("lists structured macros including nested macros", () => {
    expect(listMacros(fixture)).toEqual([
      {
        name: "expand",
        parameters: { title: "Details" },
        bodyType: "rich-text"
      },
      {
        name: "code",
        parameters: { language: "typescript" },
        bodyType: "plain-text"
      }
    ]);
  });

  it("preserves macro bodies when editing non-macro paragraph text", () => {
    const updated = replaceParagraphTextPreservingMacros(fixture, "Intro", "Updated intro");

    expect(updated).toContain("Updated intro");
    expect(updated).toContain("ac:name=\"expand\"");
    expect(updated).toContain("ac:name=\"code\"");
    expect(updated).toContain("<![CDATA[const value = \"<keep>\";]]>");
  });

  it("fails closed on malformed storage", () => {
    expect(() => validateStorage("<ac:structured-macro>")).toThrow("Invalid Confluence storage XHTML");
  });
});
