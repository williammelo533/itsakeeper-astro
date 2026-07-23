async page => {
  const viewports = [
    { label: "1440x1000", width: 1440, height: 1000 },
    { label: "1200x900", width: 1200, height: 900 },
    { label: "900x900", width: 900, height: 900 },
    { label: "390x844", width: 390, height: 844 },
  ];
  const consoleErrors = [];
  const pageErrors = [];
  const requestFailures = [];

  page.on("console", message => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("requestfailed", request => {
    requestFailures.push(`${request.method()} ${request.url()} ${request.failure()?.errorText || ""}`);
  });

  await page.emulateMedia({ reducedMotion: "reduce" });
  const results = [];

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("http://127.0.0.1:4321/", { waitUntil: "networkidle" });

    const section = page.locator("#meet-lisa");
    await section.scrollIntoViewIfNeeded();
    await page.locator(".biography img").evaluateAll(async images => {
      await Promise.all(images.map(image => {
        if (image.complete && image.naturalWidth > 0) return Promise.resolve();
        return new Promise(resolve => {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", resolve, { once: true });
        });
      }));
    });

    const report = await page.evaluate(({ width }) => {
      const select = selector => document.querySelector(selector);
      const rect = selector => select(selector).getBoundingClientRect();
      const roundedRect = selector => {
        const box = rect(selector);
        return {
          x: Math.round(box.x),
          y: Math.round(box.y),
          width: Math.round(box.width),
          height: Math.round(box.height),
          right: Math.round(box.right),
          bottom: Math.round(box.bottom),
        };
      };
      const rgb = value => (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
      const luminance = value => {
        const channels = rgb(value).map(channel => {
          const normalized = channel / 255;
          return normalized <= 0.03928
            ? normalized / 12.92
            : ((normalized + 0.055) / 1.055) ** 2.4;
        });
        return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
      };
      const contrast = (foreground, background) => {
        const lighter = Math.max(luminance(foreground), luminance(background));
        const darker = Math.min(luminance(foreground), luminance(background));
        return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
      };

      const arch = rect("[data-biography-arch]");
      const print = rect("[data-biography-print]");
      const vertical = rect(".biography__line--vertical");
      const horizontal = rect(".biography__line--horizontal");
      const heading = rect("#biography-title");
      const button = rect(".biography__action");
      const sectionStyle = getComputedStyle(select("#meet-lisa"));
      const bodyStyle = getComputedStyle(select(".biography__copy .editorial-copy"));
      const headingStyle = getComputedStyle(select("#biography-title"));
      const eyebrowStyle = getComputedStyle(select(".biography .section-eyebrow"));
      const archStyle = getComputedStyle(select("[data-biography-arch]"));
      const scriptStyle = getComputedStyle(select(".biography__script-word"));
      const images = [...document.querySelectorAll(".biography img")];
      const overlapX = Math.max(0, Math.min(arch.right, print.right) - Math.max(arch.left, print.left));
      const overlapY = Math.max(0, Math.min(arch.bottom, print.bottom) - Math.max(arch.top, print.top));
      const background = sectionStyle.backgroundColor;
      const issues = [];

      if (document.documentElement.scrollWidth > document.documentElement.clientWidth) {
        issues.push("horizontal overflow");
      }
      if (overlapX < 40 || overlapY < 70) issues.push("photo overlap is too shallow");
      if (Math.abs(vertical.left - arch.left) > 1) issues.push("vertical hairline is detached");
      if (Math.abs(horizontal.top - print.top) > 1) issues.push("horizontal hairline is detached");
      if (parseFloat(bodyStyle.fontSize) < 16) issues.push("body copy is below 16px");
      if (!archStyle.borderTopLeftRadius || archStyle.borderTopLeftRadius === "0px") {
        issues.push("arch crown is missing");
      }
      if (archStyle.borderBottomLeftRadius !== "0px") issues.push("arch bottom is not square");
      if (images.some(image => !image.complete || image.naturalWidth === 0)) issues.push("image failed to load");
      if (images.some(image => getComputedStyle(image).objectFit !== "cover")) issues.push("image crop is not cover");
      if (select(".biography__script-word").textContent.trim().split(/\s+/).length !== 1) {
        issues.push("script accent contains more than one word");
      }
      if (!/(Modernline|Allura|Brush Script)/i.test(scriptStyle.fontFamily)) {
        issues.push("script accent is not using the script family");
      }
      if (contrast(bodyStyle.color, background) < 4.5) issues.push("body contrast is below 4.5:1");
      if (contrast(headingStyle.color, background) < 3) issues.push("heading contrast is below 3:1");
      if (contrast(eyebrowStyle.color, background) < 4.5) issues.push("eyebrow contrast is below 4.5:1");
      if (width > 1050 && Math.abs(heading.top - arch.top) > 2) {
        issues.push("desktop heading and arch tops are not aligned");
      }
      if (width > 1050 && print.bottom <= button.bottom) {
        issues.push("front print does not fall below the CTA");
      }
      if (/\[.*pending.*\]/i.test(select("#meet-lisa").textContent)) issues.push("placeholder leaked");
      if (select("#meet-lisa").querySelectorAll("a").length !== 1) {
        issues.push("section should contain exactly one link");
      }
      if (getComputedStyle(select(".biography__copy")).transform !== "none") {
        issues.push("copy still moves under reduced motion");
      }
      if (getComputedStyle(select(".biography__media")).transform !== "none") {
        issues.push("media still moves under reduced motion");
      }

      return {
        issues,
        geometry: {
          section: roundedRect("#meet-lisa"),
          heading: roundedRect("#biography-title"),
          button: roundedRect(".biography__action"),
          arch: roundedRect("[data-biography-arch]"),
          print: roundedRect("[data-biography-print]"),
          overlapX: Math.round(overlapX),
          overlapY: Math.round(overlapY),
          verticalAnchorDelta: Math.round(Math.abs(vertical.left - arch.left)),
          horizontalAnchorDelta: Math.round(Math.abs(horizontal.top - print.top)),
        },
        typography: {
          bodySize: bodyStyle.fontSize,
          scriptSize: scriptStyle.fontSize,
        },
        contrast: {
          body: contrast(bodyStyle.color, background),
          heading: contrast(headingStyle.color, background),
          eyebrow: contrast(eyebrowStyle.color, background),
        },
        images: images.map(image => ({
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
          objectFit: getComputedStyle(image).objectFit,
        })),
      };
    }, { width: viewport.width });

    const button = page.locator(".biography__action");
    await button.focus();
    const focus = await button.evaluate(element => {
      const style = getComputedStyle(element);
      return {
        visible: element.matches(":focus-visible"),
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
      };
    });
    if (!focus.visible || focus.outlineStyle === "none" || parseFloat(focus.outlineWidth) < 2) {
      report.issues.push("CTA focus state is not visibly rendered");
    }

    await button.evaluate(element => element.blur());
    await page.addStyleTag({ content: ".site-header,.skip-link{visibility:hidden!important}" });
    await page.evaluate(() => {
      window.scrollTo({ top: document.querySelector("#meet-lisa").offsetTop, behavior: "instant" });
    });
    await section.screenshot({
      path: `artifacts/qa/meet-lisa/meet-lisa-${viewport.label}.png`,
    });

    results.push({ viewport: viewport.label, focus, ...report });
  }

  return {
    passed: results.every(result => result.issues.length === 0)
      && consoleErrors.length === 0
      && pageErrors.length === 0
      && requestFailures.length === 0,
    consoleErrors,
    pageErrors,
    requestFailures,
    results,
  };
}
