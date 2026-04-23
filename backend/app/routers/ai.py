import json
import logging

from anthropic import (
    APIConnectionError,
    APITimeoutError,
    AuthenticationError,
    BadRequestError,
    PermissionDeniedError,
    RateLimitError,
)
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse

from app.config import settings
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.ai import ChatRequest, ExploreRequest, ExploreResponse, Scenario
from app.services.ai import build_explore_prompt, build_system_prompt, client

logger = logging.getLogger(__name__)

router = APIRouter()


def _friendly_error(exc: Exception) -> tuple[str, str]:
    """Map an Anthropic/network exception to (code, user-facing message)."""
    if isinstance(exc, RateLimitError):
        return "rate_limit", "You're sending messages too quickly. Wait a few seconds and try again."
    if isinstance(exc, (AuthenticationError, PermissionDeniedError)):
        return "auth", "AI is misconfigured on the server. Please contact support."
    if isinstance(exc, APITimeoutError):
        return "timeout", "The AI took too long to respond. Try a shorter message or try again."
    if isinstance(exc, APIConnectionError):
        return "network", "Couldn't reach the AI service. Check your connection and try again."
    if isinstance(exc, BadRequestError):
        return "bad_request", "That message couldn't be processed. Try rewording or shortening it."
    status = getattr(exc, "status_code", None)
    if status == 529:
        return "overloaded", "Claude is overloaded right now. Please try again in a moment."
    return "unknown", "Something went wrong talking to the AI. Please try again."


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
            code, message = _friendly_error(exc)
            yield f"data: {json.dumps({'type': 'error', 'code': code, 'message': message})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/explore", response_model=ExploreResponse)
async def explore(
    payload: ExploreRequest,
    current_user: User = Depends(get_current_user),
):
    prompt = build_explore_prompt(payload.script_context)
    try:
        response = await client.messages.create(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=2500,
            messages=[{"role": "user", "content": prompt}],
        )
    except Exception as exc:
        logger.exception("AI explore failed")
        code, message = _friendly_error(exc)
        raise HTTPException(status_code=502, detail={"code": code, "message": message})

    raw = "".join(block.text for block in response.content if getattr(block, "type", None) == "text").strip()
    try:
        data = json.loads(raw)
        scenarios = [Scenario(**s) for s in data["scenarios"]]
    except (json.JSONDecodeError, KeyError, TypeError, ValueError) as exc:
        logger.warning("AI explore returned malformed JSON: %s", exc)
        raise HTTPException(
            status_code=502,
            detail={"code": "parse_error", "message": "The AI returned an unexpected response. Please try again."},
        )

    return ExploreResponse(scenarios=scenarios)
