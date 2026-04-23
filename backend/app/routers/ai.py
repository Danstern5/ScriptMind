import json
import logging

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse

from app.config import settings
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.ai import ChatRequest
from app.services.ai import build_system_prompt, client

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/chat")
async def chat(
    payload: ChatRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
):
    system = build_system_prompt(payload.script_context)
    messages = [{"role": m.role, "content": m.content} for m in payload.messages]

    async def event_stream():
        try:
            async with client.messages.stream(
                model=settings.ANTHROPIC_MODEL,
                max_tokens=1000,
                system=system,
                messages=messages,
            ) as stream:
                async for text in stream.text_stream:
                    if await request.is_disconnected():
                        return
                    yield f"data: {json.dumps({'type': 'token', 'text': text})}\n\n"
                final = await stream.get_final_message()
                usage = {
                    "input_tokens": final.usage.input_tokens,
                    "output_tokens": final.usage.output_tokens,
                }
                yield f"data: {json.dumps({'type': 'done', 'usage': usage})}\n\n"
        except Exception as exc:
            logger.exception("AI chat stream failed")
            yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
