import type { QueryResult } from "@tinacms/astro/data";
import type { IslandRegistry } from "@tinacms/astro/experimental";
import HomepagePage from "../../components/HomepagePage.astro";
import JournalPortfolio from "../../components/JournalPortfolio.astro";
import { getHomepagePage, getPortfolioPage } from "./data";

export const homepageWrapper = {
  tag: "div",
  className: "tina-page-shell",
};

export const portfolioWrapper = {
  tag: "div",
  className: "tina-page-shell tina-portfolio-shell",
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
  portfolio: {
    fetch: () => getPortfolioPage(),
    component: JournalPortfolio,
    wrapper: portfolioWrapper,
    propsFromData: (result) => ({
      data: (result as QueryResult<Record<string, unknown>>).data,
    }),
  },
};
