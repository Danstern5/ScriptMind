from typing import Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ScriptElement(BaseModel):
    type: str
    text: str


class ScriptContext(BaseModel):
    elements: list[ScriptElement] = Field(default_factory=list)
    current_scene: int = 0


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    script_context: ScriptContext


class ExploreRequest(BaseModel):
    script_context: ScriptContext


class ScenarioImpact(BaseModel):
    tone: str
    character: str
    plot: str


class Scenario(BaseModel):
    title: str
    description: str
    impact: ScenarioImpact
    preview: str


class ExploreResponse(BaseModel):
    scenarios: list[Scenario]
