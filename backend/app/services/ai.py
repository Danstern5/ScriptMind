import re

from anthropic import AsyncAnthropic

from app.config import settings
from app.schemas.ai import ScriptContext

client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

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
        "Respond concisely (2-4 short paragraphs max). Be specific to this screenplay — "
        "mention character names, scene details, etc."
    )
