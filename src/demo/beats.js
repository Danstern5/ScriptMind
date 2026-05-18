export const storyBeats = [
  {
    id: 'beat-1',
    number: 1,
    title: 'The Last Rehearsal',
    sceneHeading: "INT. MAYA'S APARTMENT — MORNING",
    characters: ['Maya', 'Jamie'],
    summary: "Maya and Jamie run the pitch one final time. Jamie steadies her with a single note: stop trying to convince him — just tell him the truth.",
    isBranchPoint: false,
    position: { x: 60, y: 140 },
  },
  {
    id: 'beat-2',
    number: 2,
    title: 'The Room',
    sceneHeading: 'INT. CRESCENT VENTURES — CONFERENCE ROOM — DAY',
    characters: ['Maya', 'Nolan'],
    summary: "Two years of work compressed into twelve minutes. Nolan asks the one question Maya rehearsed for. Her answer surprises both of them.",
    isBranchPoint: false,
    position: { x: 360, y: 140 },
  },
  {
    id: 'beat-3-invest',
    number: 3,
    title: 'After',
    sceneHeading: "INT. MAYA'S APARTMENT — EVENING",
    characters: ['Maya'],
    summary: "Alone with the answer she wanted, Maya discovers that yes is its own kind of silence.",
    isBranchPoint: true,
    variant: 'invest',
    position: { x: 660, y: 140 },
  },
  {
    id: 'beat-3-pass',
    number: 3,
    title: 'After',
    sceneHeading: "INT. MAYA'S APARTMENT — EVENING",
    characters: ['Maya'],
    summary: "Alone with the answer she feared, Maya finds the only thing left to do is work.",
    isBranchPoint: true,
    variant: 'pass',
    position: { x: 660, y: 140 },
  },
];

export const getBeats = (branch) =>
  storyBeats.filter((b) => !b.variant || b.variant === branch);
