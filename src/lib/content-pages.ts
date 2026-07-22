import type { EditorialPageData } from "../content/page-types";

const modules = import.meta.glob<{ default: EditorialPageData }>(
  "../../content/pages/*.json",
  { eager: true }
);

const documents = new Map<string, EditorialPageData>(
  Object.entries(modules).map(([path, module]) => [path.split("/").at(-1) || "", module.default])
);

export const getContentPage = (contentPath: string) => {
  const page = documents.get(contentPath);
  if (!page) throw new Error(`Missing content page document: ${contentPath}`);
  return page;
};

export const contentPages = [...documents.values()];
