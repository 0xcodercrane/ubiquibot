import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { gfm } from "micromark-extension-gfm";
import { getLogger } from "../bindings";

type MdastNode = {
  type: string;
  value: string;
  children: MdastNode[];
};
const cachedResult: Record<string, string[]> = {};
const traverse = (node: MdastNode, itemsToExclude: string[]): Record<string, string[]> => {
  if (!cachedResult[node.type]) {
    cachedResult[node.type] = [];
  }

  if (!itemsToExclude.includes(node.type)) {
    // skip pushing if the node type has been excluded
    cachedResult[node.type].push(node.value);
  } else if (node.children.length > 0) {
    node.children.forEach((child) => traverse(child, itemsToExclude));
  }

  return cachedResult;
};

export const parseComments = async (comments: string[], itemsToExclude: string[]): Promise<Record<string, string[]>> => {
  const logger = getLogger();
  const result: Record<string, string[]> = {};
  for (const comment of comments) {
    const tree = fromMarkdown(comment, {
      extensions: [gfm()],
      mdastExtensions: [gfmFromMarkdown()],
    });

    logger.debug("tree generated: ", tree);

    const parsedContent = traverse(tree as MdastNode, itemsToExclude);
    for (const key of Object.keys(parsedContent)) {
      if (Object.keys(result).includes(key)) {
        result[key].push(...parsedContent[key]);
      } else {
        result[key] = parsedContent[key];
      }
    }
  }

  return result;
};
