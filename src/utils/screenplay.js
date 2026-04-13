import { stripHtml } from "./html";

const COMMON_TRANSITIONS = ["CUT TO:", "FADE OUT.", "FADE IN:", "SMASH CUT TO:", "MATCH CUT TO:", "JUMP CUT TO:", "DISSOLVE TO:", "TIME CUT:", "FREEZE FRAME"];
const SCENE_PREFIXES = ["INT. ", "EXT. ", "INT./EXT. ", "I/E. "];
const TIMES_OF_DAY = [" — DAY", " — NIGHT", " — DAWN", " — DUSK", " — MORNING", " — AFTERNOON", " — EVENING", " — LATER", " — CONTINUOUS", " — MOMENTS LATER"];

export { COMMON_TRANSITIONS, SCENE_PREFIXES, TIMES_OF_DAY };

export function getScenes(elements) {
  const scenes = [];
  elements.forEach((el, idx) => {
    if (el.type === "scene-heading") {
      scenes.push({ index: idx, text: el.text, id: el.id });
    }
  });
  return scenes;
}

export function getWordCount(elements) {
  return elements.reduce((sum, el) => sum + stripHtml(el.text).split(/\s+/).filter(Boolean).length, 0);
}

export function getPageCount(elements) {
  return Math.max(1, Math.ceil(getWordCount(elements) / 250));
}

export function getSmartSuggestions(elements, currentEl) {
  if (!currentEl) return [];
  const query = stripHtml(currentEl.text).toUpperCase();

  if (currentEl.type === "character") {
    const names = [...new Set(
      elements.filter(e => e.type === "character").map(e => stripHtml(e.text).toUpperCase().trim()).filter(Boolean)
    )];
    if (!query) return names.slice(0, 8);
    return names.filter(n => n.startsWith(query) && n !== query).slice(0, 6);
  }

  if (currentEl.type === "scene-heading") {
    if (!query || query.length <= 3) {
      const prefixMatches = SCENE_PREFIXES.filter(p => p.startsWith(query));
      if (prefixMatches.length > 0) return prefixMatches;
    }
    const locations = [...new Set(
      elements.filter(e => e.type === "scene-heading").map(e => stripHtml(e.text).toUpperCase().trim()).filter(Boolean)
    )];
    const hasTime = TIMES_OF_DAY.some(t => query.includes(t.trim()));
    if (!hasTime && query.length > 5) {
      const timeMatches = TIMES_OF_DAY.map(t => query + t);
      const locMatches = locations.filter(l => l.startsWith(query) && l !== query);
      return [...locMatches, ...timeMatches].slice(0, 6);
    }
    return locations.filter(l => l.startsWith(query) && l !== query).slice(0, 6);
  }

  if (currentEl.type === "transition") {
    if (!query) return COMMON_TRANSITIONS.slice(0, 6);
    return COMMON_TRANSITIONS.filter(t => t.startsWith(query) && t !== query).slice(0, 6);
  }

  return [];
}

export function getCurrentSceneIndex(elements, activeElId) {
  let sceneIdx = 0;
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].type === "scene-heading") sceneIdx++;
    if (elements[i].id === activeElId) return sceneIdx;
  }
  return sceneIdx;
}
