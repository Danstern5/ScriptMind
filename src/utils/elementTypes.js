import { stripHtml } from "./html";

const TAB_CYCLE = ["action", "character", "dialogue", "action"];

export { TAB_CYCLE };

export function getNextType(currentType) {
  if (currentType === "character") return "dialogue";
  if (currentType === "dialogue") return "action";
  if (currentType === "parenthetical") return "dialogue";
  if (currentType === "scene-heading") return "action";
  if (currentType === "transition") return "action";
  if (currentType === "shot") return "action";
  if (currentType === "centered") return "action";
  return "action";
}

export function cycleType(currentType) {
  const idx = TAB_CYCLE.indexOf(currentType);
  if (idx === -1) return "action";
  return TAB_CYCLE[(idx + 1) % TAB_CYCLE.length];
}

export function autoFormatText(type, text) {
  if (type === "scene-heading") {
    let t = text.toUpperCase();
    const plain = stripHtml(t);
    if (plain && !plain.startsWith("INT.") && !plain.startsWith("EXT.") && !plain.startsWith("INT/EXT") && !plain.startsWith("I/E")) {
      t = "INT. " + t;
    }
    return t;
  }
  if (type === "character") return text.toUpperCase();
  if (type === "transition") return text.toUpperCase();
  if (type === "shot") return text.toUpperCase();
  return text;
}
