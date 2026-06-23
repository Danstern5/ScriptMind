import re

from anthropic import AsyncAnthropic

from app.config import settings
from app.schemas.ai import ScriptContext

client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY, max_retries=3)

_TAG_RE = re.compile(r"<[^>]+>")


def _strip_html(text: str) -> str:
    return _TAG_RE.sub("", text or "")


def _render_script(context: ScriptContext) -> str:
    lines = []
    for el in context.elements:
        prefix = "\n" if el.type in ("scene-heading", "character") else ""
        lines.append(prefix + _strip_html(el.text))
    return "\n".join(lines)


def build_system_prompt(context: ScriptContext) -> str:
    script_text = _render_script(context)
    return (
        "You are ScriptMind, an expert AI screenwriting collaborator. "
        "You have access to the writer's full screenplay and are helping them craft their story. "
        "Be specific to THEIR script — reference their characters, scenes, and dialogue by name. "
        "Be concise, insightful, and practical. Use a warm but professional tone. "
        "Format with bullet points (•) sparingly. Use *asterisks* for emphasis on key terms.\n\n"
        f"CURRENT SCREENPLAY:\n{script_text}\n\n"
        f"CURRENT POSITION: Scene {context.current_scene}\n\n"
        "Be concise — surface only the major points and never be overly wordy. "
        "Use the shortest response that fully answers; expand only when the writer asks for more. "
        "Be specific to this screenplay — reference character names and scene details by name."
    )


def build_explore_prompt(context: ScriptContext) -> str:
    script_text = _render_script(context)
    return (
        "You are ScriptMind, an expert screenwriting collaborator. "
        "Generate 3 distinct alternative directions for the writer's CURRENT SCENE — "
        "each a meaningfully different creative choice (different tone, different character truth, "
        "different plot consequence). Use the full screenplay below as context: reference real "
        "character names and existing dynamics; don't invent characters that aren't in the script.\n\n"
        f"CURRENT SCREENPLAY:\n{script_text}\n\n"
        f"CURRENT SCENE: Scene {context.current_scene}\n\n"
        "Respond with ONLY a JSON object — no preamble, no markdown fences, no commentary. "
        "Match this exact shape:\n"
        "{\n"
        '  "scenarios": [\n'
        "    {\n"
        '      "title": "Short evocative name (2-4 words)",\n'
        '      "description": "1-2 sentences describing the direction and what shifts",\n'
        '      "impact": {\n'
        '        "tone": "How the scene\'s emotional register changes",\n'
        '        "character": "What this reveals or costs the character",\n'
        '        "plot": "Downstream consequences for the story"\n'
        "      },\n"
        '      "preview": "A short screenplay excerpt (~10-20 lines) showing the scene played this way. '
        "Use standard screenplay format: scene heading, action, CHARACTER NAME on its own line, "
        'dialogue below."\n'
        "    }\n"
        "  ]\n"
        "}\n\n"
        "Exactly 3 scenarios. The preview field is a single string with \\n line breaks."
    )
