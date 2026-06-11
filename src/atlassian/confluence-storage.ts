import { XMLParser, XMLValidator } from "fast-xml-parser";

export interface ConfluenceMacro {
  name: string;
  parameters: Record<string, string>;
  bodyType: "none" | "rich-text" | "plain-text";
}

type XmlNode = Record<string, unknown>;

const wrapperAttributes = 'xmlns:ac="http://atlassian.com/content"';
const parserOptions = {
  attributeNamePrefix: "@_",
  cdataPropName: "#cdata",
  ignoreAttributes: false,
  parseTagValue: false,
  preserveOrder: true
} as const;

const parser = new XMLParser(parserOptions);

export function validateStorage(storage: string): void {
  assertNoRawCdataTerminatorOutsideCdata(storage);

  const result = XMLValidator.validate(wrapStorage(storage));

  if (result !== true) {
    throw new Error("Invalid Confluence storage XHTML");
  }
}

export function listMacros(storage: string): ConfluenceMacro[] {
  validateStorage(storage);

  const macros: ConfluenceMacro[] = [];
  walkNodes(parseWrappedStorage(storage), (name, children, attributes) => {
    if (name !== "ac:structured-macro") {
      return;
    }

    macros.push({
      name: stringAttribute(attributes, "@_ac:name"),
      parameters: macroParameters(children),
      bodyType: macroBodyType(children)
    });
  });

  return macros;
}

export function replaceParagraphTextPreservingMacros(
  storage: string,
  fromText: string,
  toText: string
): string {
  validateStorage(storage);

  return replaceParagraphTextOutsideRanges(
    storage,
    findStructuredMacroRanges(storage),
    fromText,
    escapeXmlText(toText)
  );
}

export function assertExistingMacrosPreserved(currentStorage: string, nextStorage: string): void {
  validateStorage(currentStorage);
  validateStorage(nextStorage);

  for (const macroBlock of structuredMacroBlocks(currentStorage)) {
    if (!nextStorage.includes(macroBlock)) {
      throw new Error("Confluence update would remove or rewrite an existing macro");
    }
  }
}

function wrapStorage(storage: string): string {
  return `<root ${wrapperAttributes}>${storage}</root>`;
}

function unwrapStorage(wrappedStorage: string): string {
  const openingTagEnd = wrappedStorage.indexOf(">");
  const closingTagStart = wrappedStorage.lastIndexOf("</root>");

  if (openingTagEnd === -1 || closingTagStart === -1) {
    throw new Error("Invalid Confluence storage XHTML");
  }

  return wrappedStorage.slice(openingTagEnd + 1, closingTagStart);
}

function parseWrappedStorage(storage: string): XmlNode[] {
  return parser.parse(wrapStorage(storage)) as XmlNode[];
}

function assertNoRawCdataTerminatorOutsideCdata(storage: string): void {
  let index = 0;

  while (index < storage.length) {
    if (storage.startsWith("<![CDATA[", index)) {
      const closeIndex = storage.indexOf("]]>", index + "<![CDATA[".length);
      if (closeIndex === -1) {
        throw new Error("Invalid Confluence storage XHTML");
      }

      index = closeIndex + "]]>".length;
      continue;
    }

    if (storage.startsWith("]]>", index)) {
      throw new Error("Invalid Confluence storage XHTML");
    }

    index += 1;
  }
}

function walkNodes(
  nodes: XmlNode[],
  visit: (
    name: string,
    children: XmlNode[],
    attributes: Record<string, string>,
    insideMacro: boolean
  ) => void,
  insideMacro = false
): void {
  for (const node of nodes) {
    for (const [name, value] of Object.entries(node)) {
      if (name === ":@" || !Array.isArray(value)) {
        continue;
      }

      const attributes = nodeAttributes(node);
      const inCurrentMacro = insideMacro || name === "ac:structured-macro";
      visit(name, value as XmlNode[], attributes, insideMacro);
      walkNodes(value as XmlNode[], visit, inCurrentMacro);
    }
  }
}

function nodeAttributes(node: XmlNode): Record<string, string> {
  const attributes = node[":@"];

  if (!isRecord(attributes)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(attributes).filter((entry): entry is [string, string] => {
      return typeof entry[1] === "string";
    })
  );
}

function stringAttribute(attributes: Record<string, string>, name: string): string {
  return attributes[name] ?? "";
}

function macroParameters(nodes: XmlNode[]): Record<string, string> {
  const parameters: Record<string, string> = {};

  for (const node of nodes) {
    const value = node["ac:parameter"];
    if (!Array.isArray(value)) {
      continue;
    }

    const parameterName = stringAttribute(nodeAttributes(node), "@_ac:name");
    if (parameterName.length === 0) {
      continue;
    }

    parameters[parameterName] = textContent(value as XmlNode[]);
  }

  return parameters;
}

function macroBodyType(nodes: XmlNode[]): ConfluenceMacro["bodyType"] {
  for (const node of nodes) {
    if (Array.isArray(node["ac:rich-text-body"])) {
      return "rich-text";
    }

    if (Array.isArray(node["ac:plain-text-body"])) {
      return "plain-text";
    }
  }

  return "none";
}

function textContent(nodes: XmlNode[]): string {
  return nodes
    .map((node) => {
      if (typeof node["#text"] === "string") {
        return node["#text"];
      }

      return "";
    })
    .join("");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

interface ProtectedRange {
  start: number;
  end: number;
}

function findStructuredMacroRanges(storage: string): ProtectedRange[] {
  const ranges: ProtectedRange[] = [];
  const stack: number[] = [];
  let index = 0;

  while (index < storage.length) {
    const tagStart = storage.indexOf("<", index);
    if (tagStart === -1) {
      break;
    }

    if (storage.startsWith("<![CDATA[", tagStart)) {
      index = skipPast(storage, tagStart, "]]>");
      continue;
    }

    if (storage.startsWith("<!--", tagStart)) {
      index = skipPast(storage, tagStart, "-->");
      continue;
    }

    const tagEnd = findTagEnd(storage, tagStart);
    if (tagEnd === -1) {
      break;
    }

    const tag = storage.slice(tagStart, tagEnd + 1);
    if (isStructuredMacroStartTag(tag)) {
      stack.push(tagStart);
    } else if (isStructuredMacroEndTag(tag)) {
      const start = stack.pop();
      if (start !== undefined && stack.length === 0) {
        ranges.push({ start, end: tagEnd + 1 });
      }
    }

    index = tagEnd + 1;
  }

  return ranges;
}

function structuredMacroBlocks(storage: string): string[] {
  return findStructuredMacroRanges(storage).map((range) => storage.slice(range.start, range.end));
}

function replaceParagraphTextOutsideRanges(
  storage: string,
  protectedRanges: ProtectedRange[],
  fromText: string,
  escapedToText: string
): string {
  let index = 0;

  while (index < storage.length) {
    const tagStart = storage.indexOf("<p", index);
    if (tagStart === -1) {
      return storage;
    }

    const protectedRange = containingRange(protectedRanges, tagStart);
    if (protectedRange !== undefined) {
      index = protectedRange.end;
      continue;
    }

    const openingTagEnd = findTagEnd(storage, tagStart);
    if (openingTagEnd === -1 || !isParagraphStartTag(storage.slice(tagStart, openingTagEnd + 1))) {
      index = tagStart + 1;
      continue;
    }

    const closingTagStart = storage.indexOf("</p>", openingTagEnd + 1);
    if (closingTagStart === -1 || containingRange(protectedRanges, closingTagStart) !== undefined) {
      return storage;
    }

    const paragraphText = storage.slice(openingTagEnd + 1, closingTagStart);
    if (paragraphText === fromText || paragraphText === escapeXmlText(fromText)) {
      return `${storage.slice(0, openingTagEnd + 1)}${escapedToText}${storage.slice(closingTagStart)}`;
    }

    index = closingTagStart + "</p>".length;
  }

  return storage;
}

function containingRange(ranges: ProtectedRange[], index: number): ProtectedRange | undefined {
  return ranges.find((range) => range.start <= index && index < range.end);
}

function skipPast(storage: string, start: number, marker: string): number {
  const end = storage.indexOf(marker, start + marker.length);
  return end === -1 ? storage.length : end + marker.length;
}

function findTagEnd(storage: string, tagStart: number): number {
  let quote: "\"" | "'" | undefined;

  for (let index = tagStart + 1; index < storage.length; index += 1) {
    const char = storage[index];

    if (char === "\"" || char === "'") {
      quote = quote === char ? undefined : quote ?? char;
      continue;
    }

    if (char === ">" && quote === undefined) {
      return index;
    }
  }

  return -1;
}

function isStructuredMacroStartTag(tag: string): boolean {
  return tag.startsWith("<ac:structured-macro") && !tag.startsWith("</") && !tag.endsWith("/>");
}

function isStructuredMacroEndTag(tag: string): boolean {
  return tag.startsWith("</ac:structured-macro");
}

function isParagraphStartTag(tag: string): boolean {
  return /^<p(?:\s[^>]*)?>$/.test(tag);
}

function escapeXmlText(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
