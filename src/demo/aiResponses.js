import { msgId } from "../utils/ids";

// ─── Canned response content ───────────────────────────────────────────────────

export const cannedResponses = {
  chat: {
    "what's working": `The "that's everyone" exchange is the scene's best moment — and it costs almost nothing. Two people suddenly in the same sentence, the professional register dropping for one beat. It works because you don't explain it: Nolan just says it, Maya echoes it, and the room goes quiet. That restraint is exactly right.

The closet line landing differently all three times is also doing real structural work. The first delivery in Scene 1 is rote — a formula she's sharpened. The second is more grounded. By Scene 2, when Nolan asks the question and she answers without hesitation, it's stopped being a line. That progression is subtle and it's working.

What's less developed is Maya's interiority in Scene 3. Both endings have the right restraint — she doesn't perform the emotion — but the scene currently shows us *what she does* more than *what it costs her*. The whiteboard being still full of questions is the right image. There may be one more beat underneath it.`,

    "on the nose": `Not yet — but you're close to the line in a specific place. The parenthetical "(without hesitation)" before Maya answers Nolan's question in Scene 2 is doing work the line should be able to do on its own. If Jamie's coaching in Scene 1 has landed, the audience already knows this is the moment Maya stops pitching. You might not need to flag it.

The dialogue itself stays clean throughout — Maya's pitch language is precise without being expository, and Jamie's "stop trying to convince him" lands as advice rather than theme statement, which is the harder trick. Nolan's "that's everyone" is the best example of the script trusting its own material: three words, no underlining.

The place to watch is Scene 3. In the INVEST ending especially, "the sudden release of something she's been holding for two years" risks telling us what to feel. The laugh is the right instinct — let the laugh carry it without the surrounding action explaining it.`,

    default: `That's worth sitting with. The script is doing something slightly different than it appears to be doing on the surface — it looks like a pitch meeting, but it's structured around a question Maya can't ask directly.

What specifically are you working through? I can be most useful when I know whether you're solving a structural problem, a character problem, or a dialogue problem.`,
  },

  alternatives: `Here are three directions for this moment:

• *More direct:* Strip it to the core claim. Let the silence after it do the work — Maya has been precise all scene; one moment of stark brevity hits differently.

• *More vulnerable:* Have Maya reach slightly — not desperate, but let the seams show. She's been performing this version of herself since she put the blazer on. One beat where the performance slips is more revealing than anything she could say on purpose.

• *More tactical:* Turn it back on Nolan. Make his response the next thing the scene has to deal with. She's earned the right to ask him something — and the question she'd actually want to ask isn't about the investment.

The middle version might serve you best here. It keeps the intelligence but adds a human frequency that Scene 3 will need to have earned.`,

  consistency: `A few things worth flagging:

The whiteboard in Maya's apartment appears in Scene 1 and again in Scene 3 — that echo is working, and the detail that it's still full of the same questions at the end is one of the script's best structural choices. Make sure the physical description stays consistent: it's dense with diagrams and sticky notes in Scene 1, and "still full of questions" in Scene 3. Both hold.

Nolan pours water for both of them without asking — that detail is doing quiet character work (a small, unconscious power move, as the shot list notes). Make sure his warmth register stays consistent through the scene: he's practiced, not cold. The "that's everyone" beat is where his warmth becomes momentarily real rather than performed. The script handles that distinction cleanly, but it's the thing to protect in any revision.

In the PASS ending: "She manages a smile that he probably believes" — this is the right note, but "probably" is doing a lot of work. You're in Maya's POV throughout; she can't actually know what Nolan believes. Consider whether this is free indirect narration (which is fine) or an authorial intrusion (which would be the only moment of its kind in the script).`,

  discuss: `This is a strong moment in a scene that earns it. What you're doing here is letting the two characters occupy the same thought at the same time — which is rarer in a pitch scene than it should be, and it catches both of them slightly off guard.

The risk is playing it as a victory. It isn't — or not only. Maya echoes Nolan's line back to him, and what that echo means is deliberately ambiguous: she's agreeing, she's claiming it, she's surprised to be in the same sentence as him. The best version of this beat should feel like it surprised Maya too.

What comes immediately after matters: "A long beat. Nolan glances at his notes. The room is very quiet." That action line is doing exactly the right thing. Don't cut to it too quickly.`,

  rewriteScene: `Here's a tighter pass on the scene — the biggest adjustments are in the pitch section before Nolan's question. Maya's two pitch speeches are strong; the staging around them (the phone, the app) can be compressed so the momentum of the scene doesn't slow at the product moment.

Nolan's water pour is kept — it's the scene's only piece of silent character work on his side and it earns its eight words of action.

The "that's everyone" exchange is unchanged. It's the scene's fulcrum and it's already right.

The ending — whichever branch — is left open. One structural note: the long beat after "that's everyone" should be longer than feels comfortable on the page. "A long beat" is doing a lot of work. Consider specifying what each character is doing in that silence. The room is the third character — let it have a moment.`,

  suggestNext: `The next beat that wants to happen is the silence before Nolan speaks — and it wants to be longer than feels comfortable to write.

What you'd want is some piece of staging in that gap: Nolan doing something small and ordinary. Glancing at his notes. Setting his pen down. Looking briefly at his phone and not picking it up. Maya making a micro-decision about whether to fill the silence, and choosing not to. The most naturalistic version is three lines of action with no dialogue — let the room have weight before anyone resolves it.

If you want to stay in dialogue: Nolan could ask one more question before he decides. Not a trap — something that tests whether she'll hold her ground under the wait. The fact that she's already said everything she has to say is what makes the silence hers.`,
};

// ─── Category detection ────────────────────────────────────────────────────────

function getCategory(text) {
  const t = text.toLowerCase();
  if (t.includes("alternative phrasings")) return "alternatives";
  if (t.includes("check this against the rest")) return "consistency";
  if (t.includes("let's discuss this moment")) return "discuss";
  if (t.includes("please rewrite the current scene")) return "rewriteScene";
  if (t.includes("suggest what should come next")) return "suggestNext";
  return "chat";
}

function getChatResponse(text) {
  const t = text.toLowerCase();
  if (t.includes("what's working") || t.includes("what is working") || t.includes("working in this")) {
    return cannedResponses.chat["what's working"];
  }
  if (t.includes("on the nose") || t.includes("too direct") || t.includes("too obvious")) {
    return cannedResponses.chat["on the nose"];
  }
  return cannedResponses.chat.default;
}

export function getResponseText(text) {
  const category = getCategory(text);
  if (category === "chat") return getChatResponse(text);
  return cannedResponses[category];
}

// ─── Streaming simulation ──────────────────────────────────────────────────────

export function simulateStreaming(responseText, setMessages, setIsStreaming) {
  setIsStreaming(true);
  const id = msgId();
  // Add empty assistant message immediately
  setMessages((prev) => [...prev, { id, role: "assistant", text: "" }]);

  let displayed = 0;
  const total = responseText.length;

  const tick = () => {
    if (displayed >= total) {
      setIsStreaming(false);
      return;
    }
    // Variable chunk size: 2–6 chars per tick for a natural feel
    const chunk = Math.floor(Math.random() * 5) + 2;
    displayed = Math.min(displayed + chunk, total);
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, text: responseText.slice(0, displayed) } : m))
    );
    // Variable interval: 18–35ms
    const delay = Math.floor(Math.random() * 18) + 18;
    setTimeout(tick, delay);
  };

  // Small initial pause before first character appears — feels more deliberate
  setTimeout(tick, 320);
}
