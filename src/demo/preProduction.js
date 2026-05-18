// src/demo/preProduction.js

export const shotList = [
  {
    sceneId: 's1',
    sceneHeading: "INT. MAYA'S APARTMENT — MORNING",
    shots: [
      { number: 1, type: 'Static',   framing: 'Wide',      description: "Establishing. Apartment — whiteboard wall dominant. Maya at counter in blazer, coffee cup she isn't drinking.", characters: ['Maya', 'Jamie'], notes: "Hold long enough to let the whiteboard read. This room should feel like someone has been living inside one idea for a very long time." },
      { number: 2, type: 'Static',   framing: 'Medium',    description: "Maya at the counter. The stillness of someone who has been awake since 5am running scenarios.", characters: ['Maya'], notes: "Let the stillness do the work. Don't cut early." },
      { number: 3, type: 'Static',   framing: 'Medium',    description: "Jamie across from her. Grounded, watching. Waiting for Maya to be ready.", characters: ['Jamie'], notes: "Jamie's stillness is chosen, not controlled. The contrast with Maya matters." },
      { number: 4, type: 'Static',   framing: 'Close-Up',  description: "Maya's hands around the coffee cup. Knuckles, tension.", characters: ['Maya'], notes: "Insert-level close. The hands reveal what the face is trying to hide." },
      { number: 5, type: 'Static',   framing: 'OTS',       description: "Over Jamie's shoulder onto Maya as she says the line for the first time. Not quite there yet.", characters: ['Maya', 'Jamie'], notes: "First attempt at the key line — we need to feel it land slightly short." },
      { number: 6, type: 'Handheld', framing: 'Close-Up',  description: "Maya rolling her shoulders. The physical reset.", characters: ['Maya'], notes: "Very subtle handheld — just enough to feel human. The only moment of physical release in the scene." },
      { number: 7, type: 'Static',   framing: 'Close-Up',  description: "Jamie's face as she delivers the final note.", characters: ['Jamie'], notes: "Hold on her after she finishes. Her expression doesn't change — that's the point." },
      { number: 8, type: 'Static',   framing: 'Wide',      description: "Maya grabs her bag and goes. Jamie stays still in the background.", characters: ['Maya', 'Jamie'], notes: "Maya moves, Jamie doesn't. The stillness in the background is almost an answer." },
    ],
  },
  {
    sceneId: 's2',
    sceneHeading: 'INT. CRESCENT VENTURES — CONFERENCE ROOM — DAY',
    shots: [
      { number: 1,  type: 'Dolly In',  framing: 'Wide',      description: "Glass walls, long table. Nolan rises as Maya enters.", characters: ['Maya', 'Nolan'], notes: "Start wide and move in slowly as Maya crosses the threshold. The room should feel slightly overwhelming." },
      { number: 2,  type: 'Static',    framing: 'Medium',    description: "Nolan extending his hand. Practiced warmth.", characters: ['Nolan'], notes: "His warmth should read as a professional skill. The camera doesn't editorialize." },
      { number: 3,  type: 'Static',    framing: 'Medium',    description: "Maya shaking his hand. Pitch-Maya fully assembled.", characters: ['Maya'], notes: "She's composed. All the rehearsal compressed into a handshake." },
      { number: 4,  type: 'Static',    framing: 'Two-Shot',  description: "They sit opposite each other. The table between them.", characters: ['Maya', 'Nolan'], notes: "The table is the third character. Keep it in frame — the distance it creates is the subtext." },
      { number: 5,  type: 'Static',    framing: 'Insert',    description: "Nolan pouring water for both of them. He doesn't ask.", characters: ['Nolan'], notes: "Small unconscious power move. Don't signal it." },
      { number: 6,  type: 'Dolly In',  framing: 'Medium',    description: "Maya beginning the pitch. The shift as she finds her rhythm.", characters: ['Maya'], notes: "Very slow, almost imperceptible dolly in as she builds momentum." },
      { number: 7,  type: 'Static',    framing: 'Insert',    description: "Maya's phone — the app interface.", characters: [], notes: "Clean product shot. Hold long enough to register." },
      { number: 8,  type: 'Static',    framing: 'Medium',    description: "Nolan sitting back to study her.", characters: ['Nolan'], notes: "Don't cut too soon. His silence is where the tension lives." },
      { number: 9,  type: 'Static',    framing: 'Insert',    description: "Nolan's notepad and pen. His hand is still — he stopped writing.", characters: [], notes: "The stopped pen is the tell. He's no longer evaluating — he's listening." },
      { number: 10, type: 'Static',    framing: 'Close-Up',  description: "Maya's face. Waiting.", characters: ['Maya'], notes: "Hold uncomfortably long. The discomfort is the point." },
      { number: 11, type: 'Static',    framing: 'Close-Up',  description: "Nolan's face. The moment before he speaks.", characters: ['Nolan'], notes: "We should not be able to read him." },
      { number: 12, type: 'Static',    framing: 'Medium',    description: "The handshake. Hold on Maya's grip.", characters: ['Maya', 'Nolan'], notes: "Her grip is steadier than expected. That detail matters." },
    ],
  },
  {
    sceneId: 's3',
    sceneHeading: "INT. MAYA'S APARTMENT — EVENING",
    shots: [
      { number: 1, type: 'Static',     framing: 'Wide',     description: "Apartment. Same as morning. Maya on the couch, blazer still on.", characters: ['Maya'], notes: "Match the framing of Scene 1 Shot 1 exactly. Same room, same lens, same position. The echo must be unmistakable." },
      { number: 2, type: 'Static',     framing: 'Medium',   description: "Maya with phone. The decision to reach for it.", characters: ['Maya'], notes: "The deliberateness of the gesture." },
      { number: 3, type: 'Static',     framing: 'Insert',   description: "Phone screen. The text. The answer.", characters: [], notes: "Hold on the screen. The audience needs time to read and absorb." },
      { number: 4, type: 'Handheld',   framing: 'Close-Up', description: "Maya's face. The reaction — whatever it is.", characters: ['Maya'], notes: "Very subtle handheld. Don't direct the emotion. Let whatever happens happen." },
      { number: 5, type: 'Dolly Back', framing: 'Wide',     description: "Final shot. The room stays the same. She is different — or not.", characters: ['Maya'], notes: "Slow dolly back as we end. The whiteboard is still full. The questions are the same. We're not sure if she's changed — and that's correct." },
    ],
  },
];

export const lineDeliveryNotes = [
  {
    section: 'SCENE 1 — THE LAST REHEARSAL',
    lines: [
      { character: 'JAMIE', line: "You're going to walk in there and they're going to ask you who the customer is. What do you say?", note: "Matter-of-fact, not a question she's worried about. Warm but efficient. She's done this before. No drama in it." },
      { character: 'MAYA',  line: "The person who has a closet full of clothes and nothing to wear.", note: "First pass: slightly rote. She's said this a hundred times and it shows. Not flat — just not fully alive yet. A little too fast." },
      { character: 'JAMIE', line: "Good. Now say it like you've said it a thousand times.", note: "Slight smile underneath the words. Not a criticism — a coaching note. Keep it gentle, almost offhand." },
      { character: 'MAYA',  line: "The person who has a closet full of clothes and nothing to wear.", note: "Second pass: more grounded. Slower. The weight behind the sentence is different now. Still not perfect — but she's closer." },
      { character: 'JAMIE', line: "Better. One more thing.", note: "Quick, easy. Building to something she's been waiting to say." },
      { character: 'MAYA',  line: "What?", note: "Slight tension. Bracing. She knows Jamie's about to say something she doesn't want to hear." },
      { character: 'JAMIE', line: "Stop trying to convince him. Just tell him the truth.", note: "This is the key line of the scene. Deliver it quietly. Not dramatic, not warm — just specific. Like she's been holding it for the right moment. Don't land on 'truth' — land on 'him.'" },
      { character: 'MAYA',  line: "And if the truth isn't enough?", note: "Genuine vulnerability. Not rhetorical — she actually wants an answer. This is the only unguarded line Maya has in the whole script. Keep it quiet and real." },
      { character: 'JAMIE', line: "Then we'll figure out what we missed.", note: "Steady. No hesitation, no false comfort. The 'we' carries the whole relationship. This is why Maya trusts her." },
    ],
  },
  {
    section: 'SCENE 2 — THE ROOM',
    lines: [
      { character: 'NOLAN', line: "Maya. Good to finally put a face to the deck.", note: "Practiced warmth. The 'finally' is friendly, not pointed. He's good at making people feel seen. Don't oversell it — he's done this a hundred times too." },
      { character: 'MAYA',  line: "Thanks for making the time.", note: "Professional, controlled. Pitch-Maya is fully assembled now. This is a different register than Scene 1." },
      { character: 'NOLAN', line: "Walk me through it.", note: "Efficient. Small talk is over. He's ready to evaluate. Slight forward lean in the voice." },
      { character: 'MAYA',  line: "We all know the problem. You open your closet and you have nothing to wear. Not because you don't have clothes — you have plenty of clothes. You just can't see them anymore.", note: "This is Maya in her element. Build slightly through the sentence — the opening is relaxed, and it tightens toward 'you just can't see them anymore.' Land that last phrase quietly, not as a punchline. It should feel like a discovery." },
      { character: 'MAYA',  line: "You photograph what you own. The app learns your style, your body, your occasions. It tells you what to wear and why. It flags what you haven't touched in six months. Over time it knows your wardrobe better than you do.", note: "More momentum than the previous speech. She's in the rhythm. Don't rush but let the confidence carry it. 'Better than you do' — a beat of quiet certainty, not a boast." },
      { character: 'NOLAN', line: "Who's your customer? The person who knows exactly what they want, or the person who has no idea?", note: "A real question, not a trap. He's genuinely curious how she'll frame it. Neutral, evaluative — he's done his homework and this is the thing he wants to probe." },
      { character: 'MAYA',  line: "The person who has a closet full of clothes and nothing to wear.", note: "Third time. This should sound like the first time she's really meant it. No hesitation, no performance. She's not selling it — she's just saying it. Land it clean and let it sit." },
      { character: 'NOLAN', line: "That's everyone.", note: "His most unguarded moment in the script. Let it be quiet and genuine — like he's thinking it out loud rather than responding. A small beat of actual recognition. Not a compliment, not a tactic. He just hadn't thought about it that way." },
      { character: 'MAYA',  line: "That's everyone.", note: "Echo, not repetition. She's not agreeing with him — she's meeting him in the same sentence. Calm and certain. Don't add warmth; the connection is already there." },
    ],
  },
  {
    section: 'SCENE 2 — INVEST ENDING',
    lines: [
      { character: 'NOLAN', line: "Send me the docs by Friday. I want in.", note: "Already moving on to logistics before she's had a chance to react. Businesslike — the decision is made, he's efficient about it. 'I want in' is almost an afterthought that carries all the weight." },
      { character: 'MAYA',  line: "Friday.", note: "Just this one word. She's absorbing. Don't play emotion — play the shock of having nothing else to say. A beat of blankness, not happiness." },
      { character: 'NOLAN', line: "We'll have counsel loop in Monday.", note: "Already elsewhere in his calendar. Warm but efficient. He's done." },
    ],
  },
  {
    section: 'SCENE 2 — PASS ENDING',
    lines: [
      { character: 'NOLAN', line: "I love what you're building. I just don't see the wedge yet.", note: "'I love what you're building' is genuine — don't let it sound like preamble to the no. The no is also honest: 'I just don't see the wedge yet' is a real concern, not a brush-off. Deliver both halves with equal weight." },
      { character: 'MAYA',  line: "What would the wedge look like for you?", note: "Composed. She had a version of this ready. Not aggressive, not desperate — genuinely asking. She's keeping the door open without begging." },
      { character: 'NOLAN', line: "Evidence that once someone starts using it, they can't stop. The habit loop.", note: "Specific. He's thought about this. The 'habit loop' is a term of art he uses casually — it's how he thinks about consumer products. Not dismissive; he's actually telling her what she'd need." },
      { character: 'MAYA',  line: "We have retention data.", note: "Steady. Not a defense — an offering. She's not flustered. Keep it level." },
      { character: 'NOLAN', line: "Send it over. I'm not closing the door — I just need to see more.", note: "He means this. The door is genuinely not closed. Don't let it sound like a soft rejection — there's real possibility in it. Warm, direct, clean." },
    ],
  },
];
