import type { QueryResult } from "@tinacms/astro/data";
import type { IslandRegistry } from "@tinacms/astro/experimental";
import HomepagePage from "../../components/HomepagePage.astro";
import { getHomepagePage } from "./data";

export const homepageWrapper = {
  tag: "div",
  className: "tina-page-shell",
};

export const islands: IslandRegistry = {
  homepage: {
    fetch: () => getHomepagePage(),
    component: HomepagePage,
    wrapper: homepageWrapper,
    propsFromData: (result) => ({
      data: (result as QueryResult<Record<string, unknown>>).data,
    }),
  },
};
