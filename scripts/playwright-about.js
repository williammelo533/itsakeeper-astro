async (page) => {
  const root = "http://127.0.0.1:4321/about/";
  const viewports = [
    { name: "1440x1000", width: 1440, height: 1000 },
    { name: "1200x900", width: 1200, height: 900 },
    { name: "900x900", width: 900, height: 900 },
    { name: "390x844", width: 390, height: 844 },
  ];
  const report = {};

  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const viewport of viewports) {
    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];
    const failedResponses = [];
    const onConsole = (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    };
    const onPageError = (error) => pageErrors.push(error.message);
    const onRequestFailed = (request) => {
      failedRequests.push(
        `${request.method()} ${request.url()} — ${request.failure()?.errorText || "failed"}`
      );
    };
    const onResponse = (response) => {
      if (response.status() >= 400 && !response.url().includes("favicon")) {
        failedResponses.push(`${response.status()} ${response.url()}`);
      }
    };

    page.on("console", onConsole);
    page.on("pageerror", onPageError);
    page.on("requestfailed", onRequestFailed);
    page.on("response", onResponse);

    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const response = await page.goto(root, { waitUntil: "networkidle" });

    await page.evaluate(async () => {
      const step = Math.max(window.innerHeight * 0.72, 420);
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 45));
      }
      const images = [...document.querySelectorAll(".about-page img")];
      await Promise.race([
        Promise.all(images.map((image) => image.decode().catch(() => undefined))),
        new Promise((resolve) => setTimeout(resolve, 5000)),
      ]);
      window.scrollTo(0, 0);
    });
    await page.waitForFunction(() => window.scrollY === 0);

    const menuToggle = page.locator("[data-menu-toggle], .menu-toggle").first();
    let compactMenu = null;
    if (await menuToggle.isVisible()) {
      await menuToggle.focus();
      await page.keyboard.press("Enter");
      compactMenu = {
        opened: (await menuToggle.getAttribute("aria-expanded")) === "true",
      };
      await page.keyboard.press("Escape");
      compactMenu.closed = (await menuToggle.getAttribute("aria-expanded")) === "false";
      compactMenu.focusReturned = await menuToggle.evaluate(
        (node) => document.activeElement === node
      );
    }

    const links = page.locator(".about-page a[href]");
    const focusChecks = [];
    for (let index = 0; index < await links.count(); index += 1) {
      const link = links.nth(index);
      if (!(await link.isVisible())) continue;
      await link.focus();
      focusChecks.push(
        await link.evaluate((node) => {
          const style = getComputedStyle(node);
          return {
            label: node.textContent?.trim() || "",
            outlineStyle: style.outlineStyle,
            outlineWidth: Number.parseFloat(style.outlineWidth),
            outlineOffset: Number.parseFloat(style.outlineOffset),
            outlineColor: style.outlineColor,
          };
        })
      );
    }
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      window.scrollTo(0, 0);
    });
    await page.waitForFunction(() => window.scrollY === 0);

    const audit = await page.evaluate(() => {
      const documentElement = document.documentElement;
      const about = document.querySelector(".about-page");
      const originArch = document.querySelector('[data-about-arch="origin"]');
      const lessonsArch = document.querySelector('[data-about-arch="lessons"]');
      const originNote = document.querySelector(".about-origin__note");
      const hero = document.querySelector("[data-about-hero]");
      const rightPrint = document.querySelector('[data-about-hero-print="right"]');
      const rear = document.querySelector('[data-about-layer="rear"]');
      const front = document.querySelector('[data-about-layer="front"]');

      const rect = (node) => node?.getBoundingClientRect();
      const intersection = (a, b) => {
        if (!a || !b) return { width: 0, height: 0, area: 0 };
        const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
        const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
        return { width, height, area: width * height };
      };
      const archData = (node) => {
        if (!node) return null;
        const box = rect(node);
        const style = getComputedStyle(node);
        return {
          width: Math.round(box.width),
          height: Math.round(box.height),
          ratio: box.height / box.width,
          topLeftRadius: Number.parseFloat(style.borderTopLeftRadius),
          bottomLeftRadius: Number.parseFloat(style.borderBottomLeftRadius),
          bottomRightRadius: Number.parseFloat(style.borderBottomRightRadius),
          overflow: style.overflow,
        };
      };

      const internalBodyLinks = [...document.querySelectorAll("main a[href]")].filter(
        (anchor) => {
          const raw = anchor.getAttribute("href")?.trim() || "";
          if (!raw || /^(mailto:|tel:)/i.test(raw)) return false;
          return new URL(raw, location.href).origin === location.origin;
        }
      );

      const bodyNodes = [...document.querySelectorAll(".about-page p, .about-page li")].filter(
        (node) => {
          const style = getComputedStyle(node);
          const box = rect(node);
          return (
            !node.classList.contains("about-script") &&
            box.width > 0 &&
            box.height > 0 &&
            style.display !== "none" &&
            style.visibility !== "hidden"
          );
        }
      );

      const images = [...document.querySelectorAll(".about-page img")].map((image) => {
        const box = rect(image);
        const pictureBox = rect(image.closest("picture"));
        const width = Number.parseInt(image.getAttribute("width") || "0", 10);
        const height = Number.parseInt(image.getAttribute("height") || "0", 10);
        return {
          alt: image.alt,
          src: image.currentSrc || image.src,
          complete: image.complete,
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
          widthAttribute: width,
          heightAttribute: height,
          renderedWidth: Math.round(box.width),
          renderedHeight: Math.round(box.height),
          visible: box.width > 0 && box.height > 0,
          aspectDelta:
            width && height && image.naturalWidth && image.naturalHeight
              ? Math.abs(width / height - image.naturalWidth / image.naturalHeight)
              : 1,
          frameDelta: pictureBox
            ? Math.max(
                Math.abs(box.width - pictureBox.width),
                Math.abs(box.height - pictureBox.height)
              )
            : 999,
          objectFit: getComputedStyle(image).objectFit,
        };
      });

      const clippedText = [];
      const walker = document.createTreeWalker(
        about,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode(node) {
            if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT;
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const style = getComputedStyle(parent);
            return style.display === "none" || style.visibility === "hidden"
              ? NodeFilter.FILTER_REJECT
              : NodeFilter.FILTER_ACCEPT;
          },
        }
      );
      while (walker.nextNode()) {
        const range = document.createRange();
        range.selectNodeContents(walker.currentNode);
        for (const textRect of range.getClientRects()) {
          if (textRect.left < -1 || textRect.right > innerWidth + 1) {
            clippedText.push({
              text: walker.currentNode.textContent.trim().slice(0, 80),
              left: Math.round(textRect.left),
              right: Math.round(textRect.right),
            });
          }
        }
      }

      const activeAnimations = document
        .getAnimations()
        .filter((animation) => animation.playState === "running").length;
      const originArchBox = rect(originArch);
      const originNoteBox = rect(originNote);
      const rearBox = rect(rear);
      const frontBox = rect(front);
      const personalIntersection = intersection(rearBox, frontBox);
      const originNoteIntersection = intersection(originArchBox, originNoteBox);
      const rightPrintBox = rect(rightPrint);
      const heroBox = rect(hero);

      const visibleLines = [...document.querySelectorAll("[data-construction-line]")].filter(
        (line) => {
          const style = getComputedStyle(line);
          const box = rect(line);
          return style.display !== "none" && box.width > 0;
        }
      );

      return {
        status: about?.getAttribute("data-content-status"),
        signature: about?.getAttribute("data-signature-device"),
        heading: document.querySelector("#about-hero-title")?.textContent
          ?.replace(/\s+/g, " ")
          .trim(),
        sectionAnchorExists: Boolean(
          document.querySelector("#it-started-with-my-own-children")
        ),
        robots: document.querySelector('meta[name="robots"]')?.content || null,
        canonical: document.querySelector('link[rel="canonical"]')?.href || null,
        overflow: documentElement.scrollWidth - documentElement.clientWidth,
        bodyLinks: internalBodyLinks.map((anchor) => anchor.getAttribute("href")),
        minimumBodyFont: Math.min(
          ...bodyNodes.map((node) => Number.parseFloat(getComputedStyle(node).fontSize))
        ),
        placeholderLeak:
          /\[(?:PENDIENTE|PENDING|VALIDAR|FECHA|INSERT|PLACEHOLDER|PRICE|DATE|URL|LINK|NUMBER|CONFIRM|NAME)[^\]]*\]|CONTENT PENDING/i.test(
            about?.innerText || ""
          ),
        clippedText,
        originArch: archData(originArch),
        lessonsArch: archData(lessonsArch),
        personalOverlapRatio:
          personalIntersection.area /
          Math.max(1, Math.min(rearBox.width * rearBox.height, frontBox.width * frontBox.height)),
        personalIntersection: {
          width: Math.round(personalIntersection.width),
          height: Math.round(personalIntersection.height),
        },
        personalOrder:
          frontBox.left < rearBox.left && frontBox.bottom > rearBox.bottom,
        originNoteOverlapRatio:
          originNoteIntersection.area / Math.max(1, originNoteBox.width * originNoteBox.height),
        rightPrintBleed: {
          beyondRight: Math.round(rightPrintBox.right - innerWidth),
          insideHero: Math.round(
            Math.max(0, Math.min(rightPrintBox.bottom, heroBox.bottom) - Math.max(rightPrintBox.top, heroBox.top))
          ),
          height: Math.round(rightPrintBox.height),
        },
        visibleLines: visibleLines.map((line) => {
          const anchor = line.getAttribute("data-line-anchor");
          const target = document.querySelector(`[data-line-target="${anchor}"]`);
          const lineBox = rect(line);
          const targetBox = rect(target);
          return {
            anchor,
            borderTop: Number.parseFloat(getComputedStyle(line).borderTopWidth),
            width: Math.round(lineBox.width),
            targetExists: Boolean(target),
            touchesTarget: Boolean(
              targetBox &&
                lineBox.right >= targetBox.left - 2 &&
                lineBox.left <= targetBox.right + 2 &&
                lineBox.top >= targetBox.top - 2 &&
                lineBox.top <= targetBox.bottom + 2
            ),
          };
        }),
        images,
        activeAnimations,
        reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
        scrollBehavior: getComputedStyle(documentElement).scrollBehavior,
        currentPage:
          document
            .querySelector('.primary-nav__link[aria-current="page"]')
            ?.textContent?.trim() || null,
      };
    });

    await page.screenshot({
      fullPage: true,
      path: `.artifacts/about-redesign/final/${viewport.name}.png`,
      scale: "css",
      type: "png",
      animations: "disabled",
    });

    const failures = [];
    if (response?.status() !== 200) failures.push(`HTTP ${response?.status()}`);
    if (audit.status !== "draft") failures.push(`status=${audit.status}`);
    if (audit.signature !== "arch") failures.push(`signature=${audit.signature}`);
    if (
      audit.heading !== "Meet Lisa — The Heart Behind It's A Keeper"
    ) failures.push(`heading=${audit.heading}`);
    if (!audit.sectionAnchorExists) failures.push("missing hero anchor target");
    if (!audit.robots?.includes("noindex")) failures.push(`robots=${audit.robots}`);
    if (audit.canonical !== "https://itsakeeperphotography.netlify.app/about/") {
      failures.push(`canonical=${audit.canonical}`);
    }
    if (audit.overflow > 1) failures.push(`overflow=${audit.overflow}`);
    if (audit.bodyLinks.length > 4) failures.push(`bodyLinks=${audit.bodyLinks.length}`);
    if (audit.minimumBodyFont < 16) failures.push(`bodyFont=${audit.minimumBodyFont}`);
    if (audit.placeholderLeak) failures.push("placeholder leakage");
    if (audit.clippedText.length) failures.push(`clippedText=${audit.clippedText.length}`);
    if (
      !audit.originArch ||
      audit.originArch.ratio < 1.15 ||
      audit.originArch.ratio > 1.45 ||
      audit.originArch.topLeftRadius <= 0 ||
      audit.originArch.bottomLeftRadius > 1 ||
      audit.originArch.bottomRightRadius > 1
    ) failures.push("origin arch geometry");
    if (
      !audit.lessonsArch ||
      audit.lessonsArch.ratio < 1.15 ||
      audit.lessonsArch.ratio > 1.45 ||
      audit.lessonsArch.topLeftRadius <= 0 ||
      audit.lessonsArch.bottomLeftRadius > 1 ||
      audit.lessonsArch.bottomRightRadius > 1
    ) failures.push("lessons arch geometry");
    if (audit.personalOverlapRatio < 0.2) {
      failures.push(`personalOverlap=${audit.personalOverlapRatio.toFixed(3)}`);
    }
    if (!audit.personalOrder) failures.push("personal portrait order");
    if (audit.originNoteOverlapRatio < 0.35) {
      failures.push(`originNoteOverlap=${audit.originNoteOverlapRatio.toFixed(3)}`);
    }
    if (audit.rightPrintBleed.beyondRight < 24) failures.push("hero right print does not bleed");
    if (audit.rightPrintBleed.insideHero < audit.rightPrintBleed.height * 0.5) {
      failures.push("hero right print mostly outside");
    }
    if (
      audit.visibleLines.some(
        (line) =>
          line.borderTop < 0.75 ||
          line.borderTop > 1.25 ||
          !line.targetExists ||
          !line.touchesTarget
      )
    ) failures.push("construction line geometry");
    if (!audit.reducedMotion || audit.activeAnimations > 0) {
      failures.push(`reducedMotion animations=${audit.activeAnimations}`);
    }
    if (audit.currentPage !== "About") failures.push(`currentPage=${audit.currentPage}`);
    if (
      focusChecks.some(
        (focus) =>
          focus.outlineStyle === "none" ||
          focus.outlineWidth < 2 ||
          focus.outlineOffset < 3 ||
          focus.outlineColor === "rgba(0, 0, 0, 0)"
      )
    ) failures.push("focus outline");
    if (
      compactMenu &&
      (!compactMenu.opened || !compactMenu.closed || !compactMenu.focusReturned)
    ) failures.push("compact menu keyboard behavior");

    const brokenImages = audit.images.filter(
      (image) =>
        !image.complete ||
        image.naturalWidth <= 0 ||
        image.naturalHeight <= 0 ||
        image.widthAttribute <= 0 ||
        image.heightAttribute <= 0 ||
        image.aspectDelta > 0.01 ||
        !/\.webp(?:$|\?)/i.test(image.src) ||
        (image.visible &&
          (image.frameDelta > 1.5 ||
            image.objectFit !== "cover" ||
            image.naturalWidth + 1 < image.renderedWidth))
    );
    if (brokenImages.length) failures.push(`images=${brokenImages.length}`);
    if (consoleErrors.length) failures.push(`consoleErrors=${consoleErrors.length}`);
    if (pageErrors.length) failures.push(`pageErrors=${pageErrors.length}`);
    if (failedRequests.length) failures.push(`failedRequests=${failedRequests.length}`);
    if (failedResponses.length) failures.push(`failedResponses=${failedResponses.length}`);

    report[viewport.name] = {
      ...audit,
      compactMenu,
      focusChecks,
      brokenImages,
      consoleErrors,
      pageErrors,
      failedRequests,
      failedResponses,
      failures,
    };

    page.off("console", onConsole);
    page.off("pageerror", onPageError);
    page.off("requestfailed", onRequestFailed);
    page.off("response", onResponse);
  }

  return {
    screenshotCount: viewports.length,
    failureCount: Object.values(report).reduce(
      (total, result) => total + result.failures.length,
      0
    ),
    report,
  };
}
