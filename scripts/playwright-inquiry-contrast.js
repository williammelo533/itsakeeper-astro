async (page) => {
  const root = "http://localhost:4321/";
  const artifacts = "artifacts/audits";
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  const sampleContrast = (textSelector, backgroundSelector = textSelector) =>
    page.evaluate(
      ({ textSelector, backgroundSelector }) => {
        const parseRgb = (value) => {
          const channels = value.match(/[\d.]+/g)?.slice(0, 3).map(Number);
          if (!channels || channels.length !== 3) throw new Error(`Cannot parse ${value}`);
          return channels;
        };
        const luminance = (channels) => {
          const normalized = channels.map((channel) => {
            const value = channel / 255;
            return value <= 0.04045
              ? value / 12.92
              : ((value + 0.055) / 1.055) ** 2.4;
          });
          return (
            0.2126 * normalized[0] +
            0.7152 * normalized[1] +
            0.0722 * normalized[2]
          );
        };
        const ratio = (foreground, background) => {
          const light = Math.max(luminance(foreground), luminance(background));
          const dark = Math.min(luminance(foreground), luminance(background));
          return (light + 0.05) / (dark + 0.05);
        };
        const textElement = document.querySelector(textSelector);
        const backgroundElement = document.querySelector(backgroundSelector);
        if (!textElement || !backgroundElement) {
          throw new Error(`Missing contrast target: ${textSelector} / ${backgroundSelector}`);
        }
        const color = getComputedStyle(textElement).color;
        const background = getComputedStyle(backgroundElement).backgroundColor;
        return {
          color,
          background,
          ratio: Number(ratio(parseRgb(color), parseRgb(background)).toFixed(2)),
        };
      },
      { textSelector, backgroundSelector }
    );

  const chooseWithoutAutoAdvance = async (selector) => {
    await page.locator(selector).first().evaluate((input) => {
      input.checked = true;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  };

  const openStepOne = async (width, height) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(root, { waitUntil: "domcontentloaded" });
    await page.locator("[data-start-inquiry]").click();
    await page.locator('[data-form-step="1"]').waitFor({ state: "visible" });
    await page.locator("[data-inquiry-workspace]").scrollIntoViewIfNeeded();
  };

  const goToStepThree = async () => {
    await chooseWithoutAutoAdvance('[data-form-step="1"] input[name="session_type"]');
    await page.locator('[data-form-step="1"] [data-inquiry-next]').click();
    await page.locator('[data-form-step="2"]').waitFor({ state: "visible" });
    await chooseWithoutAutoAdvance('[data-form-step="2"] input[name="season"]');
    await page.locator('[data-form-step="2"] [data-inquiry-next]').click();
    await page.locator('[data-form-step="3"]').waitFor({ state: "visible" });
    await chooseWithoutAutoAdvance(
      '[data-form-step="3"] input[name="location_preference"]'
    );
  };

  const report = {
    desktop: {},
    mobile: {},
    consoleErrors,
  };

  await openStepOne(1440, 1000);
  report.desktop.frameLabelsRemoved = !/frame (one|two|three|four)|final frame/i.test(
    await page.locator("[data-inquiry-form]").innerText()
  );
  report.desktop.noHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
  );
  report.desktop.currentProgress = await sampleContrast(
    '.film-progress__frame[aria-current="step"]'
  );
  report.desktop.pendingProgress = await sampleContrast(
    '.film-progress__frame[data-progress-step="2"]'
  );
  report.desktop.continueDefault = await sampleContrast(
    '[data-form-step="1"] [data-inquiry-next]'
  );
  report.desktop.backDefault = await sampleContrast(
    '[data-form-step="1"] [data-inquiry-back]',
    ".inquiry__workspace"
  );
  await page.locator('[data-form-step="1"] [data-inquiry-next]').hover();
  report.desktop.continueHover = await sampleContrast(
    '[data-form-step="1"] [data-inquiry-next]'
  );
  await page.locator('[data-form-step="1"] [data-inquiry-back]').focus();
  await page.keyboard.press("Tab");
  report.desktop.continueHasKeyboardFocus = await page
    .locator('[data-form-step="1"] [data-inquiry-next]')
    .evaluate((button) => button === document.activeElement && button.matches(":focus-visible"));
  report.desktop.continueFocus = await sampleContrast(
    '[data-form-step="1"] [data-inquiry-next]'
  );
  report.desktop.focusOutline = await page
    .locator('[data-form-step="1"] [data-inquiry-next]')
    .evaluate((button) => {
      const style = getComputedStyle(button);
      return `${style.outlineWidth} ${style.outlineStyle} ${style.outlineColor}`;
    });
  await page.locator("[data-inquiry-workspace]").screenshot({
    path: `${artifacts}/inquiry-step-1-contrast-1440.png`,
  });

  await goToStepThree();
  report.desktop.completedProgress = await sampleContrast(
    '.film-progress__frame[data-progress-step="1"]'
  );
  report.desktop.currentProgressStepThree = await sampleContrast(
    '.film-progress__frame[aria-current="step"]'
  );
  report.desktop.locationUnselected = await sampleContrast(
    '.location-option:nth-child(2) strong',
    '.location-option:nth-child(2) > span'
  );
  report.desktop.locationSelected = await sampleContrast(
    '.location-option:nth-child(1) strong',
    '.location-option:nth-child(1) > span'
  );
  await page.locator("[data-inquiry-workspace]").screenshot({
    path: `${artifacts}/inquiry-step-3-contrast-1440.png`,
  });

  await page.locator('[data-form-step="3"] [data-inquiry-next]').click();
  await page.locator('[data-form-step="4"]').waitFor({ state: "visible" });
  report.desktop.storyLabel = await sampleContrast(
    '.note-field label',
    ".note-field"
  );

  await openStepOne(390, 844);
  report.mobile.noHorizontalOverflowStepOne = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
  );
  await page.locator("[data-inquiry-workspace]").screenshot({
    path: `${artifacts}/inquiry-step-1-contrast-390.png`,
  });
  await goToStepThree();
  report.mobile.noHorizontalOverflowStepThree = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
  );
  report.mobile.currentProgress = await sampleContrast(
    '.film-progress__frame[aria-current="step"]'
  );
  report.mobile.locationUnselected = await sampleContrast(
    '.location-option:nth-child(2) strong',
    '.location-option:nth-child(2) > span'
  );
  report.mobile.locationSelected = await sampleContrast(
    '.location-option:nth-child(1) strong',
    '.location-option:nth-child(1) > span'
  );
  await page.locator("[data-inquiry-workspace]").screenshot({
    path: `${artifacts}/inquiry-step-3-contrast-390.png`,
  });

  return report;
}
