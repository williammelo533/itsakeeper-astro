async (page) => {
  const root = "http://127.0.0.1:4321/about/";
  const viewports = [
    { name: "1440x1000", width: 1440, height: 1000 },
    { name: "1200x900", width: 1200, height: 900 },
    { name: "900x900", width: 900, height: 900 },
    { name: "390x844", width: 390, height: 844 },
  ];
  const report = {};

  for (const viewport of viewports) {
    const consoleErrors = [];
    const pageErrors = [];
    const failedResponses = [];
    const onConsole = (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    };
    const onPageError = (error) => pageErrors.push(error.message);
    const onResponse = (response) => {
      if (response.status() >= 400 && !response.url().includes("favicon")) {
        failedResponses.push(`${response.status()} ${response.url()}`);
      }
    };

    page.on("console", onConsole);
    page.on("pageerror", onPageError);
    page.on("response", onResponse);

    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(root, { waitUntil: "domcontentloaded" });

    const images = page.locator(".about-page img");
    for (let index = 0; index < await images.count(); index += 1) {
      const image = images.nth(index);
      await image.scrollIntoViewIfNeeded();
      await image.evaluate((node) => {
        if (node.complete && node.naturalWidth > 0) return true;
        return new Promise((resolve) => {
          node.addEventListener("load", () => resolve(true), { once: true });
          node.addEventListener("error", () => resolve(false), { once: true });
        });
      });
    }

    const menuToggle = page.locator("[data-menu-toggle]");
    let compactMenu = null;
    if (await menuToggle.isVisible()) {
      await menuToggle.click();
      const expanded = await menuToggle.getAttribute("aria-expanded");
      await page.keyboard.press("Escape");
      compactMenu = {
        opened: expanded === "true",
        closed: (await menuToggle.getAttribute("aria-expanded")) === "false",
        focusReturned: await menuToggle.evaluate((node) => document.activeElement === node),
      };
    }

    const finalLink = page.locator(".about-final .outline-button");
    await finalLink.focus();
    const focus = await finalLink.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        outlineColor: style.outlineColor,
      };
    });

    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    });
    await page.waitForFunction(() => window.scrollY === 0);
    await page.waitForFunction(
      () => document.getAnimations().every((animation) => animation.playState !== "running"),
      undefined,
      { timeout: 2000 }
    );

    const audit = await page.evaluate(() => {
      const rootElement = document.documentElement;
      const hero = document.querySelector(".about-hero").getBoundingClientRect();
      const portrait = document.querySelector(".about-hero__portrait").getBoundingClientRect();
      const quote = document.querySelector(".about-belief blockquote p");
      const quoteBox = quote.getBoundingClientRect();
      const paragraphs = [...document.querySelectorAll(".about-page p, .about-page li")];
      const imageNodes = [...document.querySelectorAll(".about-page img")];
      const localLinks = [...document.querySelectorAll(".about-page a")].filter((link) => {
        const url = new URL(link.href, window.location.href);
        return url.origin === window.location.origin;
      });
      const ruleWidths = [
        ".about-hero__rule",
        ".about-origin__rule",
        ".about-camera__rule",
        ".about-final__rule",
      ].map((selector) => parseFloat(getComputedStyle(document.querySelector(selector)).width));

      return {
        horizontalOverflow: rootElement.scrollWidth > rootElement.clientWidth + 1,
        documentWidth: rootElement.scrollWidth,
        viewportWidth: rootElement.clientWidth,
        bodyLinks: localLinks.map((link) => new URL(link.href).pathname),
        minimumCopySize: Math.min(...paragraphs.map((node) => parseFloat(getComputedStyle(node).fontSize))),
        images: imageNodes.map((image) => ({
          alt: image.alt,
          complete: image.complete,
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
          width: Math.round(image.getBoundingClientRect().width),
          height: Math.round(image.getBoundingClientRect().height),
        })),
        heroOverlap: Math.round(portrait.bottom - hero.bottom),
        heroArch: getComputedStyle(document.querySelector(".about-hero__portrait")).borderTopLeftRadius,
        quoteFits: quote.scrollWidth <= quote.clientWidth + 1 && quoteBox.right <= innerWidth + 1,
        quoteRight: Math.round(quoteBox.right),
        hairlines: ruleWidths,
        currentPage: document.querySelector('.primary-nav__link[aria-current="page"]')?.textContent?.trim(),
        robots: document.querySelector('meta[name="robots"]')?.content,
        activeAnimations: document.getAnimations().filter((animation) => animation.playState === "running").length,
      };
    });

    await page.screenshot({
      fullPage: true,
      path: `artifacts/qa/about/redesign-${viewport.name}.png`,
      scale: "css",
      type: "png",
    });

    page.off("console", onConsole);
    page.off("pageerror", onPageError);
    page.off("response", onResponse);

    report[viewport.name] = {
      ...audit,
      compactMenu,
      focus,
      consoleErrors,
      pageErrors,
      failedResponses,
    };
  }

  return report;
}
