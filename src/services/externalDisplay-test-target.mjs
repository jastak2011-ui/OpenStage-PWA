// src/services/externalDisplay.ts
var payloadKey = "openstage-external-display-payload";
function supportsPresentationApi() {
  return typeof window !== "undefined" && "PresentationRequest" in window;
}
function supportsExternalWindow() {
  return typeof window !== "undefined" && typeof window.open === "function";
}
function externalPrompterUrl() {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("externalDisplay", "prompter");
  return url.toString();
}
async function openExternalPrompter() {
  const url = externalPrompterUrl();
  const presentationCtor = window.PresentationRequest;
  if (presentationCtor) {
    const request = new presentationCtor([url]);
    await request.start();
    return "presentation-api";
  }
  const opened = window.open(url, "openstage-external-prompter", "popup=yes,width=1280,height=720");
  return opened ? "window" : "blocked";
}
function saveExternalDisplayPayload(payload) {
  try {
    localStorage.setItem(payloadKey, JSON.stringify(payload));
  } catch {
    return;
  }
  try {
    const channel = new BroadcastChannel("openstage-external-display");
    channel.postMessage(payload);
    channel.close();
  } catch {
    return;
  }
}
function loadExternalDisplayPayload() {
  try {
    const raw = localStorage.getItem(payloadKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function isExternalPrompterRoute() {
  return new URLSearchParams(window.location.search).get("externalDisplay") === "prompter";
}
function externalRotationDegrees(rotation) {
  if (rotation === "cw-90") return 90;
  if (rotation === "ccw-90") return -90;
  if (rotation === "rotate-180") return 180;
  return 0;
}
function normalizeExternalDisplaySettings(settings) {
  return {
    enabled: Boolean(settings?.enabled),
    outputMode: settings?.outputMode ?? "standard",
    rotation: settings?.rotation ?? "normal",
    scaleMode: settings?.scaleMode ?? "fit",
    manualZoom: Number(settings?.manualZoom ?? 1) || 1,
    offsetX: Number(settings?.offsetX ?? 0) || 0,
    offsetY: Number(settings?.offsetY ?? 0) || 0,
    safeMargin: Number(settings?.safeMargin ?? 4) || 0,
    showCalibration: Boolean(settings?.showCalibration),
    fillScreenTest: Boolean(settings?.fillScreenTest),
    profileName: settings?.profileName ?? "Standard External Display"
  };
}
function appleTvPortraitPrompterSettings(settings) {
  return {
    ...settings,
    enabled: true,
    outputMode: "airplay-portrait-fill",
    profileName: "Apple TV Portrait Prompter",
    rotation: settings.rotation === "ccw-90" ? "ccw-90" : "cw-90",
    scaleMode: "fill",
    safeMargin: settings.safeMargin || 4,
    showCalibration: true
  };
}
function calculateExternalPrompterLayout(settings, viewportWidth, viewportHeight) {
  const normalized = normalizeExternalDisplaySettings(settings);
  const rotation = externalRotationDegrees(normalized.rotation);
  const isQuarterTurn = normalized.rotation === "cw-90" || normalized.rotation === "ccw-90";
  const safeInsetX = viewportWidth * (normalized.safeMargin / 100);
  const safeInsetY = viewportHeight * (normalized.safeMargin / 100);
  const availableWidth = Math.max(1, viewportWidth - safeInsetX * 2);
  const availableHeight = Math.max(1, viewportHeight - safeInsetY * 2);
  const contentWidth = isQuarterTurn ? viewportHeight : viewportWidth;
  const contentHeight = isQuarterTurn ? viewportWidth : viewportHeight;
  const rotatedWidth = isQuarterTurn ? contentHeight : contentWidth;
  const rotatedHeight = isQuarterTurn ? contentWidth : contentHeight;
  const fitScale = Math.min(availableWidth / rotatedWidth, availableHeight / rotatedHeight);
  const fillScale = Math.max(availableWidth / rotatedWidth, availableHeight / rotatedHeight);
  const baseScale = normalized.scaleMode === "fill" ? fillScale : normalized.scaleMode === "manual" ? 1 : fitScale;
  const scale = Math.max(0.1, baseScale * normalized.manualZoom);
  return {
    rotation,
    isQuarterTurn,
    contentWidth,
    contentHeight,
    rotatedWidth,
    rotatedHeight,
    availableWidth,
    availableHeight,
    scale,
    offsetX: normalized.offsetX,
    offsetY: normalized.offsetY,
    offsetTransform: `translate(-50%, -50%) translate(${normalized.offsetX}vw, ${normalized.offsetY}vh)`,
    contentTransform: `rotate(${rotation}deg) scale(${scale})`
  };
}
export {
  appleTvPortraitPrompterSettings,
  calculateExternalPrompterLayout,
  externalPrompterUrl,
  externalRotationDegrees,
  isExternalPrompterRoute,
  loadExternalDisplayPayload,
  normalizeExternalDisplaySettings,
  openExternalPrompter,
  saveExternalDisplayPayload,
  supportsExternalWindow,
  supportsPresentationApi
};
