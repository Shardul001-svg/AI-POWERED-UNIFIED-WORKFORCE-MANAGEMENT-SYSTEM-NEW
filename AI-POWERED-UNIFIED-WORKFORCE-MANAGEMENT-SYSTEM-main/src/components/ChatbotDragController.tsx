"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * ChatbotDragController
 *
 * Makes the Chatbase-injected launcher button (#chatbase-bubble-button) movable:
 * - Desktop: double-click activates drag mode, then pointer-drag to reposition
 * - Mobile: long-press (~400ms) activates drag mode, then touch-drag to reposition
 * - Single click/tap remains untouched — chatbot opens/closes normally
 *
 * Position is persisted in localStorage and clamped to the viewport on every
 * page load and resize to prevent off-screen positioning.
 *
 * This component renders nothing; it only attaches pointer/touch listeners to
 * the Chatbase bubble DOM element once it appears.
 */

const STORAGE_KEY = "workforceos-chatbot-position";
const LONG_PRESS_MS = 400;
const DOUBLE_CLICK_GAP_MS = 350;

interface SavedPos {
  x: number;
  y: number;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function getSavedPosition(): SavedPos | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedPos>;
    if (
      typeof parsed.x !== "number" ||
      typeof parsed.y !== "number" ||
      !Number.isFinite(parsed.x) ||
      !Number.isFinite(parsed.y)
    ) {
      return null;
    }
    return { x: parsed.x, y: parsed.y };
  } catch {
    return null;
  }
}

function savePosition(pos: SavedPos): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

/** Clamp position so the entire bubble stays within the viewport. */
function clampToViewport(x: number, y: number, el: HTMLElement): SavedPos {
  const rect = el.getBoundingClientRect();
  const w = rect.width || 56;
  const h = rect.height || 56;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return {
    x: clamp(x, 0, vw - w),
    y: clamp(y, 0, vh - h),
  };
}

function applyPosition(el: HTMLElement, pos: SavedPos): void {
  el.style.setProperty("left", `${pos.x}px`, "important");
  el.style.setProperty("top", `${pos.y}px`, "important");
  el.style.setProperty("bottom", "auto", "important");
  el.style.setProperty("right", "auto", "important");
}

function applyChatWindowPosition(bubble: HTMLElement): void {
  const chatWindow = document.getElementById("chatbase-bubble-window");
  if (!chatWindow) return;

  const rect = bubble.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Position chat window above the bubble by default
  const windowWidth = 400;
  const windowHeight = 500;

  // Determine horizontal position
  let windowLeft = rect.left;
  if (windowLeft + windowWidth > vw) {
    windowLeft = Math.max(0, vw - windowWidth - 8);
  }

  // Determine vertical position — above bubble if possible, below if not
  if (rect.top < windowHeight + 16) {
    // Not enough room above — place below
    chatWindow.style.setProperty("bottom", "auto", "important");
    chatWindow.style.setProperty("top", `${rect.bottom + 8}px`, "important");
  } else {
    const windowBottom = vh - rect.top + 8;
    chatWindow.style.setProperty("top", "auto", "important");
    chatWindow.style.setProperty("bottom", `${windowBottom}px`, "important");
  }

  chatWindow.style.setProperty("left", `${windowLeft}px`, "important");
  chatWindow.style.setProperty("right", "auto", "important");
}

export default function ChatbotDragController() {
  const isDragging = useRef(false);
  const dragActivated = useRef(false);
  const dragOffset = useRef({ dx: 0, dy: 0 });

  // Double-click tracking (desktop)
  const lastClickTime = useRef(0);

  // Long-press tracking (mobile)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  // Ref to prevent chatbot toggle when drag just finished
  const suppressNextClick = useRef(false);

  /** Find or wait for the Chatbase bubble button */
  const findBubble = useCallback((): HTMLElement | null => {
    return document.getElementById("chatbase-bubble-button");
  }, []);

  /** Core setup: attach all event listeners to the Chatbase bubble */
  const setup = useCallback(() => {
    const bubble = findBubble();
    if (!bubble) return false;

    // Prevent duplicate setup
    if (bubble.dataset.dragReady === "1") return true;
    bubble.dataset.dragReady = "1";

    // ----- Restore saved position -----
    const saved = getSavedPosition();
    if (saved) {
      const clamped = clampToViewport(saved.x, saved.y, bubble);
      applyPosition(bubble, clamped);
    }

    // ----- Visual indicator styles for drag mode -----
    const addDragVisual = () => {
      bubble.style.cursor = "grab";
      bubble.style.boxShadow = "0 0 0 3px rgba(45, 212, 191, 0.5), 0 8px 25px rgba(0,0,0,0.4)";
      bubble.style.transform = "scale(1.08)";
      bubble.style.transition = "transform 0.15s ease, box-shadow 0.15s ease";
    };

    const removeDragVisual = () => {
      bubble.style.cursor = "";
      bubble.style.boxShadow = "";
      bubble.style.transform = "";
      bubble.style.transition = "";
    };

    // ===== DESKTOP: double-click to activate drag mode =====
    const onPointerDown = (e: PointerEvent) => {
      // Only respond to primary button (left click) and non-touch
      if (e.pointerType === "touch") return;

      const now = Date.now();

      // Check for double-click
      if (now - lastClickTime.current < DOUBLE_CLICK_GAP_MS) {
        // Double-click detected — activate drag mode
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        lastClickTime.current = 0;

        dragActivated.current = true;
        addDragVisual();

        const rect = bubble.getBoundingClientRect();
        dragOffset.current = {
          dx: e.clientX - rect.left,
          dy: e.clientY - rect.top,
        };
        isDragging.current = true;
        suppressNextClick.current = true;

        bubble.setPointerCapture(e.pointerId);
        return;
      }

      lastClickTime.current = now;

      // If drag mode was previously activated, start dragging on next pointerdown
      if (dragActivated.current) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const rect = bubble.getBoundingClientRect();
        dragOffset.current = {
          dx: e.clientX - rect.left,
          dy: e.clientY - rect.top,
        };
        isDragging.current = true;
        suppressNextClick.current = true;
        bubble.style.cursor = "grabbing";
        bubble.setPointerCapture(e.pointerId);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      e.stopPropagation();

      const newX = e.clientX - dragOffset.current.dx;
      const newY = e.clientY - dragOffset.current.dy;
      const clamped = clampToViewport(newX, newY, bubble);
      applyPosition(bubble, clamped);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      e.stopPropagation();

      isDragging.current = false;
      dragActivated.current = false;
      removeDragVisual();

      // Save final position
      const rect = bubble.getBoundingClientRect();
      savePosition({ x: rect.left, y: rect.top });
      applyChatWindowPosition(bubble);

      // Suppress the click that will fire on pointerup
      setTimeout(() => {
        suppressNextClick.current = false;
      }, 100);
    };

    // ===== MOBILE: long-press to activate drag mode =====
    const onTouchStart = (e: TouchEvent) => {
      longPressTriggered.current = false;

      longPressTimer.current = setTimeout(() => {
        longPressTriggered.current = true;

        const touch = e.touches[0];
        if (!touch) return;

        const rect = bubble.getBoundingClientRect();
        dragOffset.current = {
          dx: touch.clientX - rect.left,
          dy: touch.clientY - rect.top,
        };
        isDragging.current = true;
        suppressNextClick.current = true;

        addDragVisual();
        bubble.style.cursor = "grabbing";

        // Haptic feedback where available
        if (navigator.vibrate) {
          navigator.vibrate(30);
        }
      }, LONG_PRESS_MS);
    };

    const onTouchMove = (e: TouchEvent) => {
      // Cancel long-press if user moves before timer fires
      if (!isDragging.current && longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }

      if (!isDragging.current) return;
      e.preventDefault(); // Prevent page scroll only during drag
      e.stopPropagation();

      const touch = e.touches[0];
      if (!touch) return;

      const newX = touch.clientX - dragOffset.current.dx;
      const newY = touch.clientY - dragOffset.current.dy;
      const clamped = clampToViewport(newX, newY, bubble);
      applyPosition(bubble, clamped);
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }

      if (!isDragging.current) return;

      e.preventDefault();
      e.stopPropagation();

      isDragging.current = false;
      removeDragVisual();

      const rect = bubble.getBoundingClientRect();
      savePosition({ x: rect.left, y: rect.top });
      applyChatWindowPosition(bubble);

      setTimeout(() => {
        suppressNextClick.current = false;
      }, 200);
    };

    // ===== Click suppression during drag =====
    const onClickCapture = (e: MouseEvent) => {
      if (suppressNextClick.current) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    };

    // ===== Attach listeners =====
    bubble.addEventListener("pointerdown", onPointerDown, { capture: true });
    bubble.addEventListener("pointermove", onPointerMove, { capture: true });
    bubble.addEventListener("pointerup", onPointerUp, { capture: true });
    bubble.addEventListener("pointercancel", onPointerUp, { capture: true });

    bubble.addEventListener("touchstart", onTouchStart, { capture: true, passive: true });
    bubble.addEventListener("touchmove", onTouchMove, { capture: true, passive: false });
    bubble.addEventListener("touchend", onTouchEnd, { capture: true });
    bubble.addEventListener("touchcancel", onTouchEnd, { capture: true });

    bubble.addEventListener("click", onClickCapture, { capture: true });

    // Prevent text selection while interacting with bubble
    bubble.style.userSelect = "none";
    bubble.style.webkitUserSelect = "none";
    bubble.style.touchAction = "none";

    // ===== Viewport resize — re-clamp position =====
    const onResize = () => {
      const saved = getSavedPosition();
      if (saved) {
        const clamped = clampToViewport(saved.x, saved.y, bubble);
        applyPosition(bubble, clamped);
        savePosition(clamped);
      } else {
        const rect = bubble.getBoundingClientRect();
        const clamped = clampToViewport(rect.left, rect.top, bubble);
        applyPosition(bubble, clamped);
      }
    };
    window.addEventListener("resize", onResize);

    // ===== Guard against Chatbase re-applying its own styles =====
    let suppressStyleObserver = false;
    const styleObserver = new MutationObserver(() => {
      if (suppressStyleObserver || isDragging.current) return;
      const saved = getSavedPosition();
      if (saved) {
        suppressStyleObserver = true;
        const clamped = clampToViewport(saved.x, saved.y, bubble);
        applyPosition(bubble, clamped);
        requestAnimationFrame(() => {
          suppressStyleObserver = false;
        });
      }
    });
    styleObserver.observe(bubble, { attributes: true, attributeFilter: ["style"] });

    // ===== Chat window position observer =====
    const chatWindowObserver = new MutationObserver(() => {
      const chatWindow = document.getElementById("chatbase-bubble-window");
      if (chatWindow) {
        applyChatWindowPosition(bubble);
      }
    });
    chatWindowObserver.observe(document.body, { childList: true, subtree: true });

    // Cleanup function stored on the element for potential teardown
    (bubble as unknown as Record<string, () => void>).__dragCleanup = () => {
      bubble.removeEventListener("pointerdown", onPointerDown, { capture: true });
      bubble.removeEventListener("pointermove", onPointerMove, { capture: true });
      bubble.removeEventListener("pointerup", onPointerUp, { capture: true });
      bubble.removeEventListener("pointercancel", onPointerUp, { capture: true });
      bubble.removeEventListener("touchstart", onTouchStart, { capture: true });
      bubble.removeEventListener("touchmove", onTouchMove, { capture: true });
      bubble.removeEventListener("touchend", onTouchEnd, { capture: true });
      bubble.removeEventListener("touchcancel", onTouchEnd, { capture: true });
      bubble.removeEventListener("click", onClickCapture, { capture: true });
      window.removeEventListener("resize", onResize);
      styleObserver.disconnect();
      chatWindowObserver.disconnect();
    };

    return true;
  }, [findBubble]);

  useEffect(() => {
    // The Chatbase script loads asynchronously — poll for the bubble element
    let attempts = 0;
    const maxAttempts = 60; // ~30 seconds max

    const trySetup = () => {
      if (setup()) return;
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(trySetup, 500);
      }
    };

    trySetup();

    // Also observe DOM for late injection
    const observer = new MutationObserver(() => {
      if (findBubble() && !(findBubble()?.dataset.dragReady === "1")) {
        setup();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      const bubble = findBubble();
      if (bubble) {
        const cleanup = (bubble as unknown as Record<string, (() => void) | undefined>).__dragCleanup;
        if (cleanup) cleanup();
      }
    };
  }, [findBubble, setup]);

  // Render nothing — this is a behavior-only controller
  return null;
}
