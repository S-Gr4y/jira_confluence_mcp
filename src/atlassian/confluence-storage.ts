import { XMLBuilder, XMLParser, XMLValidator } from "fast-xml-parser";

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
  preserveOrder: true
} as const;

const parser = new XMLParser(parserOptions);
const builder = new XMLBuilder(parserOptions);

export function validateStorage(storage: string): void {
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

  const document = parseWrappedStorage(storage);
  let replaced = false;

  walkNodes(document, (name, children, _attributes, insideMacro) => {
    if (replaced || insideMacro || name !== "p") {
      return;
    }

    const textNode = onlyTextNode(children);
    if (textNode?.["#text"] === fromText) {
      textNode["#text"] = toText;
      replaced = true;
    }
  });

  return unwrapStorage(builder.build(document));
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

function onlyTextNode(nodes: XmlNode[]): XmlNode | undefined {
  if (nodes.length !== 1 || !isRecord(nodes[0])) {
    return undefined;
  }

  const node = nodes[0];
  return typeof node["#text"] === "string" ? node : undefined;
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
