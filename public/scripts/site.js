(() => {
  "use strict";

  const root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js");

  const body = document.body;
  const header = document.querySelector("[data-site-header]");
  const hero = document.querySelector(".hero");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const primaryNav = document.querySelector("[data-primary-nav]");
  const mobileNavigation = window.matchMedia("(max-width: 1050px)");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const setMenuState = (open, returnFocus = false) => {
    if (!menuToggle || !primaryNav) return;

    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    primaryNav.classList.toggle("is-open", open);
    body.classList.toggle("menu-open", open && mobileNavigation.matches);

    if (!open && returnFocus) menuToggle.focus();
  };

  menuToggle?.addEventListener("click", () => {
    setMenuState(menuToggle.getAttribute("aria-expanded") !== "true");
  });

  primaryNav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (mobileNavigation.matches) setMenuState(false);
    });
  });

  document.addEventListener("click", (event) => {
    if (
      mobileNavigation.matches &&
      primaryNav?.classList.contains("is-open") &&
      !event.target.closest("[data-primary-nav]") &&
      !event.target.closest("[data-menu-toggle]")
    ) {
      setMenuState(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && primaryNav?.classList.contains("is-open")) {
      setMenuState(false, true);
    }
  });

  mobileNavigation.addEventListener("change", () => setMenuState(false));

  /*
   * Same-page navigation keeps spatial context instead of jumping. Pointer
   * clicks receive a calm, distance-aware GSAP scroll; keyboard activation and
   * reduced-motion visitors move instantly.
   */
  const motionStyles = getComputedStyle(root);
  const rootFontSize = Number.parseFloat(motionStyles.fontSize) || 16;
  const tokenSeconds = (name, fallback) => {
    const value = motionStyles.getPropertyValue(name).trim();
    if (!value) return fallback;
    return value.endsWith("ms") ? Number.parseFloat(value) / 1000 : Number.parseFloat(value);
  };
  const tokenPixels = (name, fallback) => {
    const value = motionStyles.getPropertyValue(name).trim();
    if (!value) return fallback;
    return value.endsWith("rem")
      ? Number.parseFloat(value) * rootFontSize
      : Number.parseFloat(value);
  };

  const anchorMotion = {
    minDuration: tokenSeconds("--duration-scroll-min", 0.7),
    maxDuration: tokenSeconds("--duration-scroll-max", 1.3),
    distance: tokenPixels("--motion-scroll-distance", 1800),
    gap: tokenPixels("--space-4", 16),
    ease: motionStyles.getPropertyValue("--ease-gsap-scroll").trim() || "power3.inOut",
  };

  let activeAnchorTween = null;
  let activeAnchorTarget = null;

  const updateAnchorHistory = (hash) => {
    if (window.location.hash !== hash) window.history.pushState(null, "", hash);
  };

  const cancelAnchorScroll = () => {
    activeAnchorTween?.kill();
    activeAnchorTween = null;
    activeAnchorTarget = null;
  };

  const resolveHashTarget = (hash) => {
    if (!hash || hash === "#") return null;
    try {
      return document.getElementById(decodeURIComponent(hash.slice(1)));
    } catch {
      return null;
    }
  };

  const scrollToHash = (hash, { animate = true, updateHistory = true } = {}) => {
    const target = resolveHashTarget(hash);
    if (!target) return false;

    cancelAnchorScroll();
    const headerOffset = header?.offsetHeight || 0;
    const targetY = Math.max(
      0,
      Math.round(target.getBoundingClientRect().top + window.scrollY - headerOffset - anchorMotion.gap)
    );
    const commit = () => {
      if (updateHistory) updateAnchorHistory(hash);
      activeAnchorTween = null;
      activeAnchorTarget = null;
    };

    if (!animate || reduceMotion.matches) {
      window.scrollTo(0, targetY);
      commit();
      return true;
    }

    if (!window.gsap) {
      window.scrollTo({ top: targetY, behavior: "smooth" });
      if (updateHistory) updateAnchorHistory(hash);
      return true;
    }

    const distance = Math.abs(targetY - window.scrollY);
    const duration = Math.min(
      anchorMotion.maxDuration,
      Math.max(anchorMotion.minDuration, distance / anchorMotion.distance)
    );
    const scrollState = { y: window.scrollY };
    activeAnchorTarget = { y: targetY, hash, updateHistory };
    activeAnchorTween = window.gsap.to(scrollState, {
      y: targetY,
      duration,
      ease: anchorMotion.ease,
      overwrite: true,
      onUpdate: () => window.scrollTo(0, scrollState.y),
      onComplete: commit,
    });
    return true;
  };

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    if (link.matches(".skip-link, [data-session-prefill]")) return;
    link.addEventListener("click", (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const hash = link.getAttribute("href");
      if (!resolveHashTarget(hash)) return;
      event.preventDefault();
      scrollToHash(hash, { animate: event.detail > 0 });
    });
  });

  ["wheel", "touchstart", "pointerdown"].forEach((eventName) => {
    window.addEventListener(eventName, cancelAnchorScroll, { passive: true });
  });

  reduceMotion.addEventListener("change", () => {
    if (!reduceMotion.matches || !activeAnchorTarget) return;
    const pending = activeAnchorTarget;
    activeAnchorTween?.kill();
    window.scrollTo(0, pending.y);
    if (pending.updateHistory) updateAnchorHistory(pending.hash);
    activeAnchorTween = null;
    activeAnchorTarget = null;
  });

  window.addEventListener("popstate", () => {
    if (window.location.hash) {
      scrollToHash(window.location.hash, { animate: false, updateHistory: false });
    }
  });

  /* The header shadow appears after the hero has moved behind the sticky bar. */
  let scrollTicking = false;
  const updateStickyState = () => {
    if (!header || !hero) {
      scrollTicking = false;
      return;
    }

    const heroBottom = hero.offsetTop + hero.offsetHeight - header.offsetHeight;
    const isPastHero = window.scrollY >= heroBottom;
    header.classList.toggle("is-past-hero", isPastHero);
    header.toggleAttribute("data-scrolled", isPastHero);
    scrollTicking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (scrollTicking) return;
      scrollTicking = true;
      window.requestAnimationFrame(updateStickyState);
    },
    { passive: true }
  );
  updateStickyState();

  /* Approximate monthly sunset times for Richland, then begin golden hour one hour earlier. */
  const renderGoldenHour = () => {
    const output = document.querySelector("[data-golden-hour]");
    if (!output) return;

    const monthlySunsetMinutes = [
      1000, 1045, 1140, 1195, 1245, 1265, 1250, 1205, 1130, 1055, 1010, 990,
    ];
    const monthText = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      month: "numeric",
    }).format(new Date());
    const monthIndex = Math.max(0, Math.min(11, Number(monthText) - 1));
    const goldenHourMinutes = Math.round((monthlySunsetMinutes[monthIndex] - 60) / 5) * 5;
    const hours = Math.floor(goldenHourMinutes / 60);
    const minutes = goldenHourMinutes % 60;
    const period = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 || 12;

    output.textContent = `Tonight, golden hour in the Tri-Cities begins around ${displayHour}:${String(
      minutes
    ).padStart(2, "0")} ${period}.`;
  };
  renderGoldenHour();

  const initInquiry = () => {
    const intro = document.querySelector("[data-inquiry-intro]");
    const workspace = document.querySelector("[data-inquiry-workspace]");
    const startButton = document.querySelector("[data-start-inquiry]");
    const form = document.querySelector("[data-inquiry-form]");
    const confirmation = document.querySelector("[data-inquiry-confirmation]");
    const filmProgress = document.querySelector("[data-film-progress]");
    const filmStrip = document.querySelector(".film-progress__strip");
    const nativeProgress = document.querySelector("[data-native-progress]");
    const stepStatus = document.querySelector("[data-step-status]");
    const submitButton = document.querySelector("[data-inquiry-submit]");
    const submitError = document.querySelector("[data-submit-error]");
    const confirmationStatus = document.querySelector("[data-confirmation-status]");
    const steps = [...document.querySelectorAll("[data-form-step]")];
    const progressFrames = [...document.querySelectorAll("[data-progress-step]")];

    if (!intro || !workspace || !startButton || !form || !confirmation || !steps.length) return;

    const stepNames = ["Session type", "Season", "Location", "Your story", "Contact details"];
    let currentStep = 1;
    let activeTimeline = null;
    let autoAdvanceTimer = 0;
    let pointerChoicePending = false;
    let lastInteractionWasPointer = false;
    const selectionSettleMs =
      Number.parseFloat(motionStyles.getPropertyValue("--duration-selection-settle")) || 350;

    form.noValidate = true;
    workspace.hidden = true;
    confirmation.hidden = true;
    steps.forEach((step, index) => {
      step.hidden = index !== 0;
      step.inert = index !== 0;
    });

    const cancelAutoAdvance = () => {
      window.clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = 0;
    };

    const killActiveTimeline = () => {
      if (!activeTimeline) return;
      activeTimeline.kill();
      activeTimeline = null;
    };

    const completeActiveTimeline = () => {
      if (!activeTimeline) return;
      const timeline = activeTimeline;
      timeline.progress(1);
      if (activeTimeline === timeline) {
        timeline.kill();
        activeTimeline = null;
      }
    };

    const canAnimate = (requested = true) =>
      requested && !reduceMotion.matches && Boolean(window.gsap);

    const alignWorkspace = ({ animate = true } = {}) => {
      workspace.scrollIntoView({
        behavior: canAnimate(animate) ? "smooth" : "auto",
        block: "start",
      });
    };

    const focusStep = (step) => {
      const legend = step?.querySelector("legend");
      if (!legend) return;
      window.requestAnimationFrame(() => legend.focus({ preventScroll: true }));
    };

    const updateProgress = (stepNumber) => {
      progressFrames.forEach((frame, index) => {
        const frameStep = index + 1;
        if (frameStep === stepNumber) frame.setAttribute("aria-current", "step");
        else frame.removeAttribute("aria-current");
        if (frameStep < stepNumber) frame.dataset.state = "complete";
        else delete frame.dataset.state;
      });

      if (nativeProgress) {
        nativeProgress.value = stepNumber;
        nativeProgress.textContent = `Step ${stepNumber} of 5`;
      }
      if (stepStatus) {
        stepStatus.textContent = `Step ${stepNumber} of 5: ${stepNames[stepNumber - 1]}.`;
      }
    };

    const resetInquiry = () => {
      cancelAutoAdvance();
      killActiveTimeline();
      form.reset();
      form.removeAttribute("aria-busy");
      currentStep = 1;
      steps.forEach((step, index) => {
        step.hidden = index !== 0;
        step.inert = index !== 0;
      });
      form.querySelectorAll('[aria-invalid="true"]').forEach((field) => {
        field.removeAttribute("aria-invalid");
      });
      form.querySelectorAll("[data-step-error], [data-field-error]").forEach((error) => {
        error.textContent = "";
      });
      if (submitError) submitError.textContent = "";
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.removeAttribute("aria-busy");
        submitButton.textContent = "Send it to Lisa";
      }
      if (confirmationStatus) confirmationStatus.textContent = "";
      updateProgress(currentStep);
    };

    const showStep = (nextStep, { animate = true, focus = true } = {}) => {
      const targetStep = Math.max(1, Math.min(steps.length, nextStep));
      if (targetStep === currentStep) {
        if (focus) {
          alignWorkspace({ animate });
          focusStep(steps[targetStep - 1]);
        }
        return;
      }

      cancelAutoAdvance();
      killActiveTimeline();
      if (focus) alignWorkspace({ animate });

      const outgoing = steps[currentStep - 1];
      const incoming = steps[targetStep - 1];
      currentStep = targetStep;
      updateProgress(currentStep);

      incoming.hidden = false;
      incoming.inert = true;
      outgoing.inert = true;

      if (window.gsap) {
        window.gsap.set(incoming, { clearProps: "display" });
      }

      const finishSwap = () => {
        outgoing.hidden = true;
        outgoing.inert = true;
        incoming.hidden = false;
        incoming.inert = false;
        if (window.gsap) {
          window.gsap.set([outgoing, incoming], {
            clearProps: "display,opacity,visibility,transform,willChange",
          });
        }
        activeTimeline = null;
        if (focus) focusStep(incoming);
      };

      if (!canAnimate(animate)) {
        finishSwap();
        return;
      }

      const { gsap } = window;
      gsap.set([outgoing, incoming], { willChange: "transform, opacity" });
      gsap.set(incoming, { autoAlpha: 0, y: 8, scale: 0.995 });
      activeTimeline = gsap
        .timeline({ onComplete: finishSwap })
        .to(outgoing, {
          autoAlpha: 0,
          y: -6,
          scale: 0.99,
          duration: 0.12,
          ease: "power2.out",
        })
        .set(outgoing, { display: "none" })
        .set(incoming, { visibility: "visible" })
        .to(incoming, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.22,
          ease: "power3.out",
        });

      if (filmStrip) {
        activeTimeline.fromTo(
          filmStrip,
          { x: 6 },
          { x: 0, duration: 0.22, ease: "power3.out", clearProps: "transform" },
          0.08
        );
      }
    };

    const revealWorkspace = ({ animate = true } = {}) => {
      workspace.hidden = false;
      confirmation.hidden = true;
      form.hidden = false;
      if (filmProgress) filmProgress.hidden = false;
      updateProgress(currentStep);

      const complete = () => {
        if (window.gsap) {
          window.gsap.set(workspace, { clearProps: "opacity,visibility,transform,willChange" });
        }
        alignWorkspace({ animate });
        focusStep(steps[currentStep - 1]);
      };

      if (!canAnimate(animate)) {
        complete();
        return;
      }

      killActiveTimeline();
      window.gsap.set(workspace, { willChange: "transform, opacity" });
      activeTimeline = window.gsap.fromTo(
        workspace,
        { autoAlpha: 0, y: 8 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.24,
          ease: "power3.out",
          onComplete: () => {
            activeTimeline = null;
            complete();
          },
        }
      );
    };

    const returnToIntro = ({ animate = true } = {}) => {
      cancelAutoAdvance();
      killActiveTimeline();

      const finish = () => {
        workspace.hidden = true;
        if (window.gsap) {
          window.gsap.set(workspace, { clearProps: "opacity,visibility,transform,willChange" });
        }
        intro.scrollIntoView({ behavior: canAnimate(animate) ? "smooth" : "auto", block: "center" });
        startButton.focus({ preventScroll: true });
      };

      if (!canAnimate(animate)) {
        finish();
        return;
      }

      window.gsap.set(workspace, { willChange: "transform, opacity" });
      activeTimeline = window.gsap.to(workspace, {
        autoAlpha: 0,
        y: -6,
        duration: 0.18,
        ease: "power2.out",
        onComplete: () => {
          activeTimeline = null;
          finish();
        },
      });
    };

    const groupConfig = {
      1: {
        name: "session_type",
        errorId: "session-type-error",
        message: "Choose the kind of session you’re planning.",
      },
      2: {
        name: "season",
        errorId: "season-error",
        message: "Choose a season, or select I’m flexible.",
      },
      3: {
        name: "location_preference",
        errorId: "location-error",
        message: "Choose where you’d like to make these photos.",
      },
    };

    Object.values(groupConfig).forEach(({ name, errorId }) => {
      form.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
        const descriptions = [input.getAttribute("aria-describedby"), errorId].filter(Boolean);
        input.setAttribute("aria-describedby", [...new Set(descriptions)].join(" "));
      });
    });

    form.querySelectorAll('input[name="season"]').forEach((input) => {
      const descriptions = [input.getAttribute("aria-describedby"), "booking-window-note"].filter(
        Boolean
      );
      input.setAttribute("aria-describedby", [...new Set(descriptions)].join(" "));
    });

    const setGroupError = (stepNumber, message = "") => {
      const config = groupConfig[stepNumber];
      if (!config) return;
      const error = document.getElementById(config.errorId);
      if (error) error.textContent = message;
      form.querySelectorAll(`input[name="${config.name}"]`).forEach((input) => {
        input.setAttribute("aria-invalid", String(Boolean(message)));
      });
    };

    const setFieldError = (field, message = "") => {
      const describedBy = field.getAttribute("aria-describedby")?.split(/\s+/) ?? [];
      const errorId = describedBy.find((id) => id.endsWith("-error"));
      const error = errorId ? document.getElementById(errorId) : null;
      if (error) error.textContent = message;
      field.setAttribute("aria-invalid", String(Boolean(message)));
    };

    const validateStep = (stepNumber, { focus = true } = {}) => {
      const step = steps[stepNumber - 1];
      if (!step) return true;

      if (groupConfig[stepNumber]) {
        const config = groupConfig[stepNumber];
        const checked = form.querySelector(`input[name="${config.name}"]:checked`);
        setGroupError(stepNumber, checked ? "" : config.message);
        if (!checked && focus) step.querySelector(`input[name="${config.name}"]`)?.focus();
        return Boolean(checked);
      }

      if (stepNumber === 4) {
        const story = form.elements.story;
        const valid = Boolean(story.value.trim());
        setFieldError(
          story,
          valid ? "" : "Tell me who the photos are for and what you hope to remember."
        );
        if (!valid && focus) story.focus();
        return valid;
      }

      if (stepNumber === 5) {
        const fields = [form.elements.name, form.elements.email, form.elements.phone];
        const messages = [
          "Enter your name.",
          "Enter an email address like name@example.com.",
          "Enter a phone number with at least 10 digits.",
        ];
        const validators = [
          (field) => Boolean(field.value.trim()),
          (field) => Boolean(field.value.trim()) && field.validity.valid,
          (field) => field.value.replace(/\D/g, "").length >= 10,
        ];
        let firstInvalid = null;

        fields.forEach((field, index) => {
          const valid = validators[index](field);
          setFieldError(field, valid ? "" : messages[index]);
          if (!valid && !firstInvalid) firstInvalid = field;
        });

        if (submitError) {
          submitError.textContent = firstInvalid
            ? "Please check the contact details above."
            : "";
        }
        if (firstInvalid && focus) firstInvalid.focus();
        return !firstInvalid;
      }

      return true;
    };

    const validateAllSteps = () => {
      for (let stepNumber = 1; stepNumber <= steps.length; stepNumber += 1) {
        if (!validateStep(stepNumber, { focus: false })) {
          showStep(stepNumber, { animate: false, focus: false });
          window.requestAnimationFrame(() => validateStep(stepNumber, { focus: true }));
          return false;
        }
      }
      return true;
    };

    startButton.addEventListener("click", (event) => {
      lastInteractionWasPointer = event.detail > 0;
      if (!confirmation.hidden) resetInquiry();
      revealWorkspace({ animate: event.detail > 0 });
    });

    document.querySelectorAll("[data-session-prefill]").forEach((link) => {
      link.addEventListener("click", (event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        event.preventDefault();
        if (!confirmation.hidden) resetInquiry();
        const value = link.dataset.sessionPrefill;
        const radio = form.querySelector(`input[name="session_type"][value="${value}"]`);
        if (radio) radio.checked = true;
        setGroupError(1, "");
        currentStep = 1;
        steps.forEach((step, index) => {
          step.hidden = index !== 0;
          step.inert = index !== 0;
        });
        revealWorkspace({ animate: event.detail > 0 });
      });
    });

    form.addEventListener("pointerdown", (event) => {
      lastInteractionWasPointer = true;
      const option = event.target.closest(".photo-option, .location-option");
      const optionStep = Number(option?.closest("[data-form-step]")?.dataset.formStep);
      pointerChoicePending = Boolean(
        option && optionStep === currentStep && currentStep >= 1 && currentStep <= 3
      );
    });

    form.addEventListener("keydown", () => {
      lastInteractionWasPointer = false;
      pointerChoicePending = false;
    });

    form.addEventListener("change", (event) => {
      const input = event.target.closest("input");
      if (!input) return;
      const stepNumber = Number(input.closest("[data-form-step]")?.dataset.formStep);

      if (input.type === "radio") {
        setGroupError(stepNumber, "");
      }

      if (
        input.type === "radio" &&
        stepNumber >= 1 &&
        stepNumber <= 3 &&
        currentStep === stepNumber &&
        pointerChoicePending
      ) {
        cancelAutoAdvance();
        const selectedCard =
          input.closest(".photo-option")?.querySelector(".photo-print") ||
          input.closest(".location-option")?.querySelector("span");
        if (selectedCard && canAnimate(true)) {
          window.gsap.fromTo(
            selectedCard,
            { scale: 0.985 },
            { scale: 0.995, duration: 0.18, ease: "power2.out", clearProps: "transform" }
          );
        }
        autoAdvanceTimer = window.setTimeout(() => {
          showStep(stepNumber + 1, { animate: true, focus: true });
        }, reduceMotion.matches ? 0 : selectionSettleMs);
      }

      pointerChoicePending = false;
    });

    form.querySelectorAll("input, textarea").forEach((field) => {
      field.addEventListener("input", () => {
        if (field.getAttribute("aria-invalid") !== "true") return;
        if (field.name === "story") validateStep(4, { focus: false });
        if (["name", "email", "phone"].includes(field.name)) validateStep(5, { focus: false });
      });
    });

    form.querySelectorAll("[data-inquiry-next]").forEach((button) => {
      button.addEventListener("click", (event) => {
        cancelAutoAdvance();
        if (!validateStep(currentStep)) return;
        showStep(currentStep + 1, { animate: event.detail > 0, focus: true });
      });
    });

    form.querySelectorAll("[data-inquiry-back]").forEach((button) => {
      button.addEventListener("click", (event) => {
        cancelAutoAdvance();
        if (currentStep === 1) returnToIntro({ animate: event.detail > 0 });
        else showStep(currentStep - 1, { animate: event.detail > 0, focus: true });
      });
    });

    const showConfirmation = ({ animate = true } = {}) => {
      progressFrames.forEach((frame) => {
        frame.dataset.state = "complete";
        frame.removeAttribute("aria-current");
      });
      if (nativeProgress) nativeProgress.value = 5;
      if (stepStatus) stepStatus.textContent = "Inquiry complete.";

      const finish = () => {
        form.hidden = true;
        if (filmProgress) filmProgress.hidden = true;
        confirmation.hidden = false;

        const title = confirmation.querySelector("#confirmation-title");
        const media = confirmation.querySelector(".inquiry-confirmation__media");
        const script = confirmation.querySelector(".inquiry-confirmation__script");

        const done = () => {
          if (window.gsap) {
            window.gsap.set([confirmation, media, script].filter(Boolean), {
              clearProps: "opacity,visibility,transform,willChange",
            });
          }
          title?.focus({ preventScroll: true });
          confirmation.scrollIntoView({ behavior: "auto", block: "center" });
          if (confirmationStatus) {
            confirmationStatus.textContent = "Your inquiry has been sent to Lisa.";
          }
          activeTimeline = null;
        };

        if (!canAnimate(animate)) {
          done();
          return;
        }

        const { gsap } = window;
        gsap.set([confirmation, media, script].filter(Boolean), {
          willChange: "transform, opacity",
        });
        activeTimeline = gsap
          .timeline({ onComplete: done })
          .fromTo(
            confirmation,
            { autoAlpha: 0, y: 8 },
            { autoAlpha: 1, y: 0, duration: 0.22, ease: "power3.out" }
          );
        if (media) {
          activeTimeline.fromTo(
            media,
            { scale: 1.02 },
            { scale: 1, duration: 0.46, ease: "power2.out" },
            0
          );
        }
        if (script) {
          activeTimeline.fromTo(
            script,
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.4, ease: "power2.out" },
            0.06
          );
        }
      };

      if (!canAnimate(animate)) {
        finish();
        return;
      }

      killActiveTimeline();
      const outgoing = [form, filmProgress].filter(Boolean);
      window.gsap.set(outgoing, { willChange: "transform, opacity" });
      activeTimeline = window.gsap.to(outgoing, {
        autoAlpha: 0,
        y: -6,
        duration: 0.18,
        ease: "power2.out",
        onComplete: () => {
          window.gsap.set(outgoing, {
            clearProps: "opacity,visibility,transform,willChange",
          });
          activeTimeline = null;
          finish();
        },
      });
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      cancelAutoAdvance();
      if (!validateAllSteps()) return;

      const payload = {
        sessionType: form.elements.session_type.value,
        season: form.elements.season.value,
        locationPreference: form.elements.location_preference.value,
        message: form.elements.story.value.trim(),
        contact: {
          name: form.elements.name.value.trim(),
          email: form.elements.email.value.trim(),
          phone: form.elements.phone.value.trim(),
        },
      };

      // Required for acceptance testing. Remove or redact personal fields in production logs.
      console.log("It’s A Keeper inquiry payload", payload);

      form.setAttribute("aria-busy", "true");
      submitButton?.setAttribute("aria-busy", "true");
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Sending…";
      }

      /*
       * TODO: POST payload to the production handler at form.action. This local placeholder
       * resolves without a network request so the full confirmation flow remains testable.
       */
      window.setTimeout(() => {
        form.removeAttribute("aria-busy");
        showConfirmation({ animate: lastInteractionWasPointer });
      }, reduceMotion.matches ? 0 : 260);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAutoAdvance();
    });

    reduceMotion.addEventListener("change", () => {
      if (reduceMotion.matches) completeActiveTimeline();
    });
  };

  initInquiry();

  /*
   * Editorial GSAP scroll reveals. Nothing is hidden if the CDN fails or the
   * visitor requests reduced motion. Timelines animate transform and opacity only.
   */
  if (window.gsap && window.ScrollTrigger) {
    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);

    const styles = getComputedStyle(root);
    const rootFontSize = Number.parseFloat(styles.fontSize) || 16;
    const token = (name) => styles.getPropertyValue(name).trim();
    const length = (name) => {
      const value = token(name);
      return value.endsWith("rem")
        ? Number.parseFloat(value) * rootFontSize
        : Number.parseFloat(value) || 0;
    };
    const seconds = (name) => {
      const value = token(name);
      return value.endsWith("ms") ? Number.parseFloat(value) / 1000 : Number.parseFloat(value) || 0;
    };

    const motion = {
      y: length("--motion-reveal-distance"),
      overlapY: length("--motion-overlap-distance"),
      heroY: length("--motion-hero-distance"),
      sectionScale: Number.parseFloat(token("--motion-section-image-scale")) || 1.02,
      reveal: seconds("--duration-reveal"),
      hero: seconds("--duration-hero"),
      heroImage: seconds("--duration-hero-image"),
      label: seconds("--duration-label"),
      stagger: seconds("--stagger-item"),
      heroStagger: seconds("--stagger-hero-script"),
      heroDelay: seconds("--delay-hero-start"),
      resizeDelay: seconds("--duration-resize-refresh") * 1000,
      trigger: token("--motion-trigger-threshold"),
      ease: token("--ease-gsap-enter"),
      imageEase: token("--ease-gsap-image"),
    };

    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      let heroFrame = 0;
      let refreshTimer = 0;

      const context = gsap.context(() => {
        const triggerConfig = (trigger) => ({
          trigger,
          start: `top ${motion.trigger}`,
          once: true,
          invalidateOnRefresh: true,
        });
        const prepare = (targets) => gsap.set(targets, { willChange: "transform, opacity" });
        const clear = (targets) =>
          gsap.set(targets, { clearProps: "opacity,visibility,transform,willChange" });

        const makeTimeline = (section, targets) => {
          const timeline = gsap.timeline({ scrollTrigger: triggerConfig(section) });
          timeline.eventCallback("onStart", () => prepare(targets));
          timeline.eventCallback("onComplete", () => clear(targets));
          return timeline;
        };

        const heroImage = document.querySelector(".hero__image");
        const heroSerif = document.querySelector(".hero__serif");
        const heroScript = document.querySelector(".hero__script");
        const heroTargets = [heroSerif, heroScript].filter(Boolean);
        if (heroTargets.length) {
          if (heroSerif) gsap.set(heroSerif, { autoAlpha: 0, y: motion.heroY });
          if (heroScript) gsap.set(heroScript, { autoAlpha: 0, y: motion.heroY });

          const heroTimeline = gsap.timeline({ paused: true });
          if (heroSerif) {
            heroTimeline.to(
              heroSerif,
              { autoAlpha: 1, y: 0, duration: motion.hero, ease: motion.ease },
              motion.heroDelay
            );
          }
          if (heroScript) {
            heroTimeline.to(
              heroScript,
              { autoAlpha: 1, y: 0, duration: motion.hero, ease: motion.ease },
              motion.heroDelay + motion.heroStagger
            );
          }
          heroTimeline.eventCallback("onComplete", () => clear(heroTargets));
          heroFrame = window.requestAnimationFrame(() => {
            prepare(heroTargets);
            heroTimeline.play(0);
          });
        }

        const story = document.querySelector(".story");
        if (story) {
          const rear = story.querySelector(".story__rear");
          const front = story.querySelector(".story__front");
          const copy = story.querySelector(".story__copy");
          const script = story.querySelector(".story__script");
          const targets = [rear, front, copy, script].filter(Boolean);
          const timeline = makeTimeline(story, targets);
          if (rear) timeline.from(rear, { autoAlpha: 0, y: motion.y, duration: motion.reveal, ease: motion.ease });
          if (front) timeline.from(front, { autoAlpha: 0, y: motion.overlapY, duration: motion.reveal, ease: motion.ease }, motion.stagger);
          if (copy) timeline.from(copy, { autoAlpha: 0, y: motion.y, duration: motion.reveal, ease: motion.ease }, motion.stagger * 2);
          if (script) timeline.from(script, { autoAlpha: 0, y: motion.y, duration: motion.reveal, ease: motion.ease }, motion.stagger * 3);
        }

        const portfolio = document.querySelector(".portfolio");
        if (portfolio) {
          const intro = portfolio.querySelector(".portfolio__intro");
          const cards = [...portfolio.querySelectorAll(".portfolio-card")];
          const targets = [intro, ...cards.flatMap((card) => [card.querySelector(".portfolio-card__image"), card.querySelector(".portfolio-card__label-wrap")])].filter(Boolean);
          const timeline = makeTimeline(portfolio, targets);
          if (intro) timeline.from(intro, { autoAlpha: 0, y: motion.y, duration: motion.reveal, ease: motion.ease });
          cards.forEach((card, index) => {
            const image = card.querySelector(".portfolio-card__image");
            const label = card.querySelector(".portfolio-card__label-wrap");
            const start = motion.stagger * (index + 1);
            if (image) timeline.from(image, { autoAlpha: 0, y: motion.y, duration: motion.reveal, ease: motion.ease }, start);
            if (label) timeline.from(label, { autoAlpha: 0, y: motion.y, duration: motion.label, ease: motion.ease }, start + motion.stagger);
          });
        }

        const banner = document.querySelector(".photo-banner");
        if (banner) {
          const image = banner.querySelector(".photo-banner__image");
          const phrase = banner.querySelector(".photo-banner__phrase");
          const targets = [image, phrase].filter(Boolean);
          const timeline = makeTimeline(banner, targets);
          if (image) timeline.from(image, { autoAlpha: 0.76, scale: motion.sectionScale, duration: motion.reveal * 1.2, ease: motion.imageEase });
          if (phrase) timeline.from(phrase, { autoAlpha: 0, y: motion.y, duration: motion.reveal, ease: motion.ease }, motion.stagger);
        }

        const biography = document.querySelector(".biography");
        if (biography) {
          const copy = biography.querySelector(".biography__copy");
          const mediaTarget = biography.querySelector(".biography__media");
          const targets = [copy, mediaTarget].filter(Boolean);
          const timeline = makeTimeline(biography, targets);
          if (copy) timeline.from(copy, { autoAlpha: 0, y: motion.y, duration: motion.reveal, ease: motion.ease });
          if (mediaTarget) timeline.from(mediaTarget, { autoAlpha: 0, y: motion.overlapY, duration: motion.reveal, ease: motion.ease }, motion.stagger);
        }

        const groupedSections = [
          [".process", ".section-intro, .process__step"],
          [".kind-words", ".section-intro, .kind-word, .kind-words__google"],
          [".inquiry__intro", ".inquiry__hook"],
          [".site-footer", ".footer-brand, .footer-address, .footer-links, .instagram-placeholder, .footer-copyright"],
        ];

        groupedSections.forEach(([sectionSelector, targetSelector]) => {
          const section = document.querySelector(sectionSelector);
          if (!section) return;
          const targets = [...section.querySelectorAll(targetSelector)];
          if (!targets.length) return;
          const timeline = makeTimeline(section, targets);
          timeline.from(targets, {
            autoAlpha: 0,
            y: motion.y,
            duration: motion.reveal,
            ease: motion.ease,
            stagger: motion.stagger,
          });
        });
      });

      const refresh = () => {
        window.clearTimeout(refreshTimer);
        refreshTimer = window.setTimeout(() => {
          updateStickyState();
          ScrollTrigger.refresh();
        }, motion.resizeDelay);
      };

      window.addEventListener("resize", refresh, { passive: true });
      window.addEventListener("load", refresh, { once: true });

      return () => {
        window.cancelAnimationFrame(heroFrame);
        window.clearTimeout(refreshTimer);
        window.removeEventListener("resize", refresh);
        window.removeEventListener("load", refresh);
        context.revert();
      };
    });
  }

  const year = String(new Date().getFullYear());
  document.querySelectorAll("[data-current-year]").forEach((node) => {
    node.textContent = year;
  });
})();
