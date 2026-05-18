export const DEMO_SCRIPT_BIBLE = {
  logline: {
    writer: "A young founder gets one shot to pitch her fashion-AI company — and one moment to decide who she'll be when the answer comes.",
    aiReading: "A character study built around a single high-stakes conversation. The script achieves its stated premise — but Maya's interior life is currently communicated more through behavior than through explicit emotional beats. The pitch scene carries the script; the apartment scenes are still finding their weight.",
  },

  genre: {
    writer: "Contemporary quiet drama. Tone references: The Worst Person in the World, Past Lives, early Celine Song — intimate, observational, present tense.",
    aiReading: "Reading as a contemporary character drama — intimate and observational, tone consistent throughout. The fashion-AI subject matter keeps the stakes legible without requiring industry knowledge, which is the right call for this register.",
  },

  themes: {
    writer: "Self-worth tied to external validation. The performance required to ask for what you want. What it costs to be seen clearly by someone who has power over you.",
    aiReading: "The performance theme is the most developed — visible in the contrast between Maya's pitch posture and her apartment posture. Self-worth and validation are present but currently implicit; they could be drawn out more explicitly, particularly in Scene 3. The 'cost of being seen' theme is the least developed on the page — it's in the subtext but hasn't fully surfaced.",
  },

  synopsis: {
    writer: "On the morning of her first serious investor pitch, Maya Chen runs her pitch one last time with her cofounder Jamie. Jamie gives her a single note: stop trying to convince him, just tell him the truth. In the meeting, Maya pitches Nolan Reeves at Crescent Ventures. The pitch goes well. The question is Nolan's answer — and what Maya does with it alone afterward.",
    aiReading: "The script follows a tight single-day arc and executes it cleanly. The setup scene (Maya/Jamie) functions as plot prep but could do more character work — Jamie's advice lands but Maya's specific fear isn't yet legible. Scene 2 is the strongest section. The aftermath scene (Scene 3) has the right restraint and both endings work individually; the PASS ending currently lands slightly stronger than the INVEST ending, which risks tipping into sentiment.",
  },

  actBreakdown: {
    act1: {
      writer: "Scene 1: INT. MAYA'S APARTMENT — MORNING. Maya and Jamie run the pitch. Jamie's note: tell him the truth, not the pitch. Stakes are established. Maya leaves.",
      aiReading: "The setup functions. Maya and Jamie's relationship is legible but underdeveloped — one more beat of history or friction between them would give Jamie's advice more weight. As written, Jamie is fully in support mode, which makes her feel less like a character and more like a delivery mechanism for the theme.",
    },
    act2: {
      writer: "Scene 2: INT. CRESCENT VENTURES — DAY. Maya pitches Nolan. The pivot: Nolan asks who the customer is. Maya's answer surprises both of them. Nolan decides.",
      aiReading: "The pitch scene is the script's best section. The 'that's everyone' exchange is the strongest moment — two people suddenly in the same sentence, which says more than the pitch does. Nolan is currently a well-drawn functional presence; consider whether one small tell could make him more dimensional without overwriting his role as an observer.",
    },
    act3: {
      writer: "Scene 3: INT. MAYA'S APARTMENT — EVENING. Maya alone with the result. The scene diverges based on Nolan's answer: INVEST (she laughs, releases two years of pressure) or PASS (she opens her laptop and types 'Find the wedge').",
      aiReading: "Both endings work structurally. The PASS ending has a cleaner final image — 'Find the wedge' as a final line earns its weight. The INVEST ending risks sentimentality in the laughing moment; it needs to feel like release rather than triumph to stay honest. Consider: what is Maya NOT doing in each scene that she expected to do? That gap might be where each version finds its emotional truth.",
    },
  },

  characters: {
    "MAYA CHEN": {
      role: "Protagonist",
      want: "To prove that what she built is real — and that she is the person who built it.",
      need: "To separate her sense of self-worth from the outcome of this meeting.",
      wound: "Two years of working in near-isolation has caused her to conflate the company with her identity. She doesn't fully know who she is without it.",
      voice: "Precise when pitching — clean sentences, no filler words. Quieter and more halting when off-script. Goes still when nervous rather than speeding up. The gap between her pitch voice and her apartment voice is where the character lives.",
      aiReading: "Maya reads clearly as the protagonist and the gap between her pitch self and her apartment self is effectively established. The pitch scene gives her room to show competence; the aftermath scenes give her room to show what competence costs. Currently the script shows the gap but doesn't yet fully explore it — Scene 3 (in both variants) could push further into what she's actually feeling beneath the composed surface.",
      photo: '/characters/maya.jpg',
      age: 28,
      physicalDescription: "East Asian American. Sharp, focused features with a quality of controlled tension. Often slightly tired around the eyes but never unfocused. Business casual as armor — the blazer is always present. Moves efficiently, nothing wasted.",
      personality: "Precise and controlled under pressure. Has learned to compress emotion into efficiency. The gap between her pitch voice and her real voice is where her character lives.",
      lookDescription: "Business casual — fitted blazer over a simple top, dark tones. Hair pulled back but not severe. She would look at home in a conference room or a coffee shop at midnight. The clothes say serious but the face says she hasn't slept enough and doesn't care.",
      arc: "Maya enters the story performing confidence and exits having been tested in the one way a performance can't prepare you for — genuine uncertainty. In the INVEST ending, she discovers that yes is its own kind of silence: relief that doesn't feel as clean as she expected. In the PASS ending, she discovers that she is still standing and still working, which is its own answer. Both endings ask: who is Maya when the pitch is over?",
      scenes: ['Scene 1 — with Jamie', 'Scene 2 — with Nolan', 'Scene 3 — alone'],
      lines: [
        { scene: 'Scene 1', context: 'First rehearsal attempt', line: "The person who has a closet full of clothes and nothing to wear." },
        { scene: 'Scene 1', context: 'Second attempt — more grounded', line: "The person who has a closet full of clothes and nothing to wear." },
        { scene: 'Scene 1', context: "Bracing before the note", line: "What?" },
        { scene: 'Scene 1', context: 'Genuine vulnerability', line: "And if the truth isn't enough?" },
        { scene: 'Scene 2', context: 'Professional greeting', line: "Thanks for making the time." },
        { scene: 'Scene 2', context: 'Opening the pitch', line: "We all know the problem. You open your closet and you have nothing to wear. Not because you don't have clothes — you have plenty of clothes. You just can't see them anymore." },
        { scene: 'Scene 2', context: 'The product', line: "You photograph what you own. The app learns your style, your body, your occasions. It tells you what to wear and why. It flags what you haven't touched in six months. Over time it knows your wardrobe better than you do." },
        { scene: 'Scene 2', context: "Answering Nolan's question — no hesitation", line: "The person who has a closet full of clothes and nothing to wear." },
        { scene: 'Scene 2', context: 'Echoing Nolan', line: "That's everyone." },
        { scene: 'Scene 2 — Invest', context: 'Processing the yes', line: "Friday." },
        { scene: 'Scene 2 — Pass', context: 'Keeping the door open', line: "What would the wedge look like for you?" },
        { scene: 'Scene 2 — Pass', context: 'Steady, not desperate', line: "We have retention data." },
      ],
    },

    "JAMIE PARK": {
      role: "Co-protagonist / Foil",
      want: "For Maya to walk into that room as herself — not a performance of a founder.",
      need: "To know that the company they're building together is still theirs after the investment changes it.",
      wound: "Has watched Maya absorb the company's identity entirely and hasn't pushed back, which is its own kind of avoidance.",
      voice: "Economical. Gives specific information without editorializing. 'Just tell him the truth' is very Jamie — short, non-sentimental, exact. She doesn't reassure; she redirects.",
      aiReading: "Jamie is currently a supporting presence rather than a fully developed character — she functions well as Maya's anchor but doesn't have her own visible stakes in Scene 1. This may be intentional for a short-form piece. If you want Jamie to feel like a co-protagonist rather than a supporting player, one moment where her own vulnerability surfaces would shift the balance considerably.",
      photo: '/characters/jamie.jpg',
      age: 27,
      physicalDescription: "Indian woman, late 20s. Calm physical presence — grounded in a way that reads as effortless. Practical style, nothing performative. Dark hair, medium length. A stillness others find steadying. The kind of face that makes you want to tell her the truth.",
      personality: "Economical with words. Gives specific information without editorializing. The person Maya calls when she doesn't know what she actually thinks. Never reassures — redirects instead.",
      lookDescription: "Practical and put-together — not trying to impress anyone. Comfortable fabrics, thoughtful layers. The kind of person whose style looks effortless because she is genuinely not thinking about it.",
      arc: "Jamie's arc is defined largely by what she withholds. She has her own anxiety about the outcome — her own stakes in the meeting she's not attending — but she compresses all of it to give Maya what she needs. The 'then we'll figure out what we missed' line is the most revealing: she's already thought about the pass scenario and has a plan. She just doesn't say so until asked.",
      scenes: ['Scene 1 — with Maya'],
      lines: [
        { scene: 'Scene 1', context: 'Opening the rehearsal', line: "You're going to walk in there and they're going to ask you who the customer is. What do you say?" },
        { scene: 'Scene 1', context: 'After the first attempt', line: "Good. Now say it like you've said it a thousand times." },
        { scene: 'Scene 1', context: 'Building to the note', line: "Better. One more thing." },
        { scene: 'Scene 1', context: 'The key note — deliver quietly', line: "Stop trying to convince him. Just tell him the truth." },
        { scene: 'Scene 1', context: 'The steadying answer', line: "Then we'll figure out what we missed." },
      ],
    },

    "NOLAN REEVES": {
      role: "Antagonist (functional)",
      want: "Evidence of a habit loop — proof that once someone uses the product, they can't stop.",
      need: "(Intentionally left open — Nolan is seen entirely through Maya's perspective.)",
      wound: "(Intentionally left open.)",
      voice: "Practiced warmth. Knows how to make professional distance feel personal. His most human moment is the 'that's everyone' echo — the one point where his professional register slips slightly and he responds as a person rather than an evaluator.",
      aiReading: "Nolan reads as a well-drawn functional antagonist. 'That's everyone' — repeating Maya's phrase back to her — is the script's best character beat for him. His interiority is fully opaque, which may be the point (we're in Maya's POV). One small physical tell might make him more dimensional in the moment before his decision, without overwriting his role.",
      photo: '/characters/nolan.jpg',
      age: 45,
      physicalDescription: "White man, 45. Distinguished without being flashy — silver beginning at the temples, well-tailored blazer, expensive watch worn as a statement of taste rather than wealth. Practices warmth as a professional skill. His default expression is attentive and slightly evaluative. Most human when he is not performing the role.",
      personality: "Has heard a thousand pitches and learned to show nothing until he's decided. Most human in the 'that's everyone' moment — the one beat where the professional mask slips slightly.",
      lookDescription: "Well-tailored blazer, no tie. The watch does the talking. The whole look is calibrated to seem approachable while maintaining authority — a skill refined over twenty years of meetings.",
      arc: "Nolan enters as an evaluator and is briefly, unexpectedly, a person — in the 'that's everyone' exchange. Whether he invests or passes, his arc is about whether that moment of recognition affects his decision. In the INVEST ending, it seems it did. In the PASS ending, professionalism wins: he passes on the evidence, not the person. Both are honest to the character.",
      scenes: ['Scene 2 — with Maya'],
      lines: [
        { scene: 'Scene 2', context: 'Greeting', line: "Maya. Good to finally put a face to the deck." },
        { scene: 'Scene 2', context: 'Ready to begin', line: "Walk me through it." },
        { scene: 'Scene 2', context: 'The key question', line: "Who's your customer? The person who knows exactly what they want, or the person who has no idea?" },
        { scene: 'Scene 2', context: 'Most unguarded moment', line: "That's everyone." },
        { scene: 'Scene 2 — Invest', context: 'The decision', line: "Send me the docs by Friday. I want in." },
        { scene: 'Scene 2 — Invest', context: 'Moving to logistics', line: "We'll have counsel loop in Monday." },
        { scene: 'Scene 2 — Pass', context: 'Honest pass', line: "I love what you're building. I just don't see the wedge yet." },
        { scene: 'Scene 2 — Pass', context: 'Explaining what he needs', line: "Evidence that once someone starts using it, they can't stop. The habit loop." },
        { scene: 'Scene 2 — Pass', context: 'Leaving the door open', line: "Send it over. I'm not closing the door — I just need to see more." },
      ],
    },
  },

  worldFacts: [
    "Contemporary setting — present day, unnamed major city.",
    "Maya has been building the company for approximately two years, primarily alongside Jamie.",
    "The product: an AI fashion advice app — photographs your closet, learns your style, suggests outfits, flags what you haven't worn in months.",
    "Crescent Ventures is a Series A firm. This is Maya's first institutional pitch.",
    "The script follows a single day: morning preparation, afternoon meeting, evening aftermath.",
  ],

  storyReferences: {
    content: `Feels tonally like *Drive* (2011) — the patience, the quiet menace, the willingness to hold on a face for longer than is comfortable.

Structurally closer to *Past Lives* — letting time pass between the major beats rather than compressing them. The drama is in the gap.

Visual references: Roger Deakins on *Sicario*, the wide-open interiors. Saul Leiter for the color palette in the apartment scenes — muted, personal, warm under grey.

NOT *Baby Driver* — no kinetic chaos, no music-driven cutting. The opposite of that energy entirely.

NOT a redemption arc. She doesn't redeem. She clarifies.`,
  },
};
