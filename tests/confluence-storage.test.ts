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
        parameters: { icon: "true", title: "Details" },
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
    const originalMacro = macroSubstring(fixture, "expand");
    const updated = replaceParagraphTextPreservingMacros(fixture, "Intro", "Updated intro");

    expect(macroSubstring(updated, "expand")).toBe(originalMacro);
    expect(updated).toContain("Updated intro");
    expect(updated).toContain("ac:name=\"expand\"");
    expect(updated).toContain("ac:name=\"code\"");
    expect(updated).toContain("<![CDATA[const value = \"<keep>\";]]>");
  });

  it("preserves comments inside macro bodies exactly", () => {
    const updated = replaceParagraphTextPreservingMacros(fixture, "Outro", "Updated outro");

    expect(macroSubstring(updated, "expand")).toContain("<!-- keep this comment exactly -->");
  });

  it("preserves self-closing elements inside macro bodies exactly", () => {
    const updated = replaceParagraphTextPreservingMacros(fixture, "Outro", "Updated outro");

    expect(macroSubstring(updated, "expand")).toContain("<br />");
  });

  it("fails closed on malformed storage", () => {
    expect(() => validateStorage("<ac:structured-macro>")).toThrow("Invalid Confluence storage XHTML");
  });

  it("fails closed on raw CDATA terminators outside CDATA sections", () => {
    expect(() => validateStorage("<p>broken ]]> no</p>")).toThrow("Invalid Confluence storage XHTML");
  });
});

function macroSubstring(storage: string, macroName: string): string {
  const start = storage.indexOf(`<ac:structured-macro ac:name="${macroName}"`);
  if (start === -1) {
    throw new Error(`Missing macro ${macroName}`);
  }

  const startTag = "<ac:structured-macro";
  const endTag = "</ac:structured-macro>";
  let depth = 0;
  let index = start;

  while (index < storage.length) {
    const nextStart = storage.indexOf(startTag, index);
    const nextEnd = storage.indexOf(endTag, index);

    if (nextEnd === -1) {
      break;
    }

    if (nextStart !== -1 && nextStart < nextEnd) {
      depth += 1;
      index = nextStart + startTag.length;
      continue;
    }

    depth -= 1;
    index = nextEnd + endTag.length;

    if (depth === 0) {
      return storage.slice(start, index);
    }
  }

  throw new Error(`Unclosed macro ${macroName}`);
}
