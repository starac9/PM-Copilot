// Module 2 — Discovery & research: finding problems worth solving.
export default {
  id: "discovery",
  title: "Discovery & Research",
  description: "Find problems worth solving: user research, problem framing, personas, and the market.",
  icon: "Search",
  lessons: [
    {
      slug: "user-research",
      title: "User research methods",
      summary: "Interviews, surveys, usability tests, and analytics — and when to use each.",
      minutes: 8,
      body: `
Discovery starts with understanding people. Research methods fall on two axes: **what people say vs. what they do**, and **qualitative (why) vs. quantitative (how many)**.

| Method | Type | Best for |
|---|---|---|
| **User interviews** | Qualitative, *say* | Understanding motivations, workflows, pain |
| **Surveys** | Quantitative, *say* | Measuring how common a need or opinion is |
| **Usability tests** | Qualitative, *do* | Finding where a design confuses people |
| **Product analytics** | Quantitative, *do* | Seeing what users actually do, at scale |
| **Field studies / shadowing** | Qualitative, *do* | Seeing real context you'd never hear about |

### Running a good interview

1. **Recruit the right people** — current users, churned users, and non-users who have the problem.
2. **Ask about the past, not the future.** "Tell me about the last time you…" beats "Would you use…?" People are bad at predicting their own behavior.
3. **Dig with "why" and "show me".** Ask them to share their screen or walk through the workflow.
4. **Don't pitch.** The moment you describe your idea, answers become polite instead of honest.
5. **Synthesize** — tag notes by theme and look for patterns across 5–8 interviews.

### Example questions

- "Walk me through how you planned your last sprint."
- "What was the most frustrating part?"
- "What have you tried to fix that? How did it go?"
- "How much time or money does this cost you today?"

### Key takeaways

- Combine what users **say** with what they **do**.
- Ask about real past behavior, never hypothetical futures.
- 5–8 interviews usually reveal the main patterns for a segment.
`,
      practice: { label: "Generate a discovery plan for your idea", to: "/dashboard" },
      ask: [
        "Give me 10 good user interview questions for a fitness app",
        "How many users should I interview?",
      ],
    },
    {
      slug: "problem-framing-jtbd",
      title: "Problem framing & Jobs to be Done",
      summary: "Fall in love with the problem, not the solution.",
      minutes: 7,
      body: `
Most failed products solved a problem nobody had — or solved the right problem in the wrong way. **Problem framing** is the habit of defining the problem precisely before jumping to solutions.

### A problem statement template

> **[User]** needs a way to **[need]** because **[insight]**. Today they **[current workaround]**, which costs them **[pain]**.

*Example:* "Remote engineering leads need a way to protect focus time for their team because constant Slack interruptions fragment deep work. Today they ask people to set status messages, which nobody respects, costing ~2 hours of productive time per engineer per day."

### Jobs to be Done (JTBD)

JTBD says people "hire" products to make progress on a **job**. The classic example: people don't want a quarter-inch drill — they want a quarter-inch hole (and really, a shelf on the wall).

A job statement:

> When **[situation]**, I want to **[motivation]**, so I can **[expected outcome]**.

*"When I'm commuting home, I want to unwind without thinking, so I can arrive relaxed."* — that job can be "hired" by a podcast, a game, or music. Those are all competitors, even though they're different categories.

### Why it matters

- It reveals **real competition** (often spreadsheets, email, or "doing nothing").
- It keeps teams focused on progress users want, not features.
- It produces better metrics: did users get the job done?

### Key takeaways

- Write the problem statement before any solution.
- Frame needs as jobs: situation → motivation → outcome.
- Your real competitor is whatever users hire today, including workarounds.
`,
      practice: { label: "Write a problem statement as part of a PRD", to: "/dashboard" },
      ask: [
        "Help me write a JTBD statement for a budgeting app",
        "What's a good problem statement vs a bad one?",
      ],
    },
    {
      slug: "personas",
      title: "Personas",
      summary: "Turning research into shared, evidence-based pictures of your users.",
      minutes: 5,
      body: `
A **persona** is a short profile of a representative user segment, built from research. It helps the whole team make decisions with the same person in mind.

### What a useful persona includes

- **Name and role** — "Priya, engineering lead at a 40-person startup".
- **Goals** — what success looks like for them.
- **Pain points** — specific, observed frustrations.
- **Context** — tools they use, constraints, how often they face the problem.
- **Quote** — a real line from an interview that captures their mindset.

### Good vs. bad personas

| Bad persona | Good persona |
|---|---|
| Invented demographics ("35, likes yoga") | Behaviors and needs observed in research |
| One persona for "everyone" | 2–3 distinct segments with different needs |
| Made once, never used | Referenced in PRDs, design reviews, and prioritization |

### Primary vs. secondary personas

Pick **one primary persona** to design for. If you try to delight everyone equally, you'll delight no one. Secondary personas matter, but don't drive the core experience.

### Key takeaways

- Personas summarize research — they aren't fiction.
- Focus on goals, pains, and context over demographics.
- Choose a primary persona and design for them first.
`,
      practice: { label: "Generate user personas in the workspace", to: "/dashboard" },
      ask: [
        "How are personas different from customer segments?",
        "Create two personas for a language-learning app",
      ],
    },
    {
      slug: "market-and-competition",
      title: "Market & competitive analysis",
      summary: "Sizing the opportunity with TAM/SAM/SOM and mapping the competition.",
      minutes: 7,
      body: `
Before investing, a PM asks: **is this opportunity big enough, and can we win?**

### Market sizing: TAM, SAM, SOM

| Term | Meaning | Example (focus app for remote teams) |
|---|---|---|
| **TAM** — Total Addressable Market | Everyone who could ever buy | All knowledge workers worldwide |
| **SAM** — Serviceable Available Market | The part your product can serve | Remote software teams in English-speaking markets |
| **SOM** — Serviceable Obtainable Market | What you can realistically win soon | 2% of SAM in 3 years |

Prefer **bottom-up** sizing: *number of target customers × price × realistic adoption*. It's more credible than "1% of a huge number".

### Competitive analysis

Map competitors on what matters to your users:

| | Us | Competitor A | Competitor B | Workaround (Slack statuses) |
|---|---|---|---|---|
| Team-level focus blocks | ✅ | ❌ | ✅ | ❌ |
| Works inside Slack | ✅ | ✅ | ❌ | ✅ |
| Price per seat | $4 | $8 | Free | Free |

Then answer: **where are we meaningfully different, and does that difference matter to the primary persona?**

### Positioning

A simple positioning statement:

> For **[target]** who **[need]**, **[product]** is a **[category]** that **[key benefit]**. Unlike **[alternative]**, we **[differentiator]**.

### Key takeaways

- Size markets bottom-up; be honest about SOM.
- Include workarounds and "do nothing" as competitors.
- Differentiation only counts if your target users care about it.
`,
      practice: { label: "Generate a market & competitor analysis", to: "/dashboard" },
      ask: [
        "Walk me through a bottom-up TAM calculation",
        "How do I write a positioning statement?",
      ],
    },
  ],
};
