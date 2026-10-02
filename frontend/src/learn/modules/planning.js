// Module 4 — Planning & prioritization: PRDs, stories, frameworks, roadmaps.
export default {
  id: "planning",
  title: "Planning & Prioritization",
  description: "Turn strategy into a plan: PRDs, user stories, prioritization frameworks, and roadmaps.",
  icon: "ListChecks",
  lessons: [
    {
      slug: "writing-a-prd",
      title: "Writing a PRD",
      summary: "The Product Requirements Document: structure, purpose, and common mistakes.",
      minutes: 8,
      body: `
A **Product Requirements Document (PRD)** aligns everyone on *what* problem we're solving, *for whom*, and *what success looks like* — before building starts.

### A strong PRD structure

1. **Problem statement** — the user problem and evidence that it matters.
2. **Target users / personas** — who it's for (and who it's not for).
3. **Goals & success metrics** — measurable outcomes, e.g. *"activation +15 pts in 60 days"*.
4. **Scope** — what's **in** the MVP, and explicitly what's **out**.
5. **Requirements / user stories** — what the product must do.
6. **Risks & assumptions** — what could sink this and what we're betting on.
7. **Open questions** — known unknowns and who will answer them.

### Principles

- **Problem first, solution second.** Engineers and designers often find better solutions when they deeply understand the problem.
- **Be specific about success.** "Improve engagement" is not a goal; "increase weekly active teams from 1,200 to 1,500" is.
- **Out of scope is a feature.** Writing down what you won't do prevents scope creep.
- **Living document.** Update it as you learn; link designs and decisions.

### Common mistakes

| Mistake | Fix |
|---|---|
| 20-page spec nobody reads | Keep it short; link out to details |
| Prescribing UI pixel-by-pixel | Describe needs; let design solve |
| No metrics | Add 3–5 measurable success metrics |
| No risks | Name the scariest assumption and how you'll test it |

### Key takeaways

- A PRD aligns the team on problem, users, success, and scope.
- Measurable metrics and an explicit out-of-scope list are non-negotiable.
- Keep it concise and keep it updated.
`,
      practice: { label: "Generate a PRD from your idea in seconds", to: "/dashboard" },
      ask: [
        "Review the structure of my PRD: what am I missing?",
        "How detailed should requirements be in a PRD?",
      ],
    },
    {
      slug: "user-stories",
      title: "User stories & acceptance criteria",
      summary: "Writing small, valuable, testable units of work.",
      minutes: 7,
      body: `
A **user story** describes a small piece of value from the user's perspective:

> As a **[type of user]**, I want **[goal]**, so that **[benefit]**.

*"As an engineering lead, I want to schedule a team focus block, so that my team gets uninterrupted time for deep work."*

### Acceptance criteria

Acceptance criteria define when a story is **done**. They should be testable. A popular format is **Given / When / Then**:

- *Given* I'm a team admin, *when* I schedule a focus block, *then* every team member sees it in their calendar.
- *Given* a focus block is active, *when* a teammate sends a Slack message, *then* the recipient's notifications are deferred until the block ends.

### INVEST: what makes a good story

| Letter | Meaning |
|---|---|
| **I**ndependent | Can be built and shipped on its own |
| **N**egotiable | Details are open to discussion |
| **V**aluable | Delivers value to a user |
| **E**stimable | The team can size it |
| **S**mall | Fits in a sprint |
| **T**estable | Has clear acceptance criteria |

### Epics and vertical slicing

Group related stories into **epics** ("Focus sessions", "Onboarding"). Slice stories **vertically** — each one should deliver a thin end-to-end slice (UI + API + data) rather than "build the database table".

### Key takeaways

- Stories describe user value, not technical tasks.
- Acceptance criteria make "done" unambiguous.
- Use INVEST and slice vertically so every story is shippable.
`,
      practice: { label: "Generate epics and stories from your PRD", to: "/dashboard" },
      ask: [
        "Rewrite this as a good user story: build a login page",
        "What's the difference between an epic and a story?",
      ],
    },
    {
      slug: "prioritization-frameworks",
      title: "Prioritization frameworks",
      summary: "RICE, MoSCoW, Kano, and Impact/Effort — and when to use each.",
      minutes: 9,
      body: `
There will always be more good ideas than capacity. Frameworks make prioritization **transparent and debatable** — they don't replace judgment.

### RICE

\`\`\`
RICE score = (Reach × Impact × Confidence) ÷ Effort
\`\`\`

| Input | Meaning | Typical scale |
|---|---|---|
| **Reach** | Users affected per period | e.g. 1,200 users/quarter |
| **Impact** | Effect on each user | 3 massive, 2 high, 1 medium, 0.5 low, 0.25 minimal |
| **Confidence** | How sure you are | 100% high, 80% medium, 50% low |
| **Effort** | Team time | person-weeks or story points |

*Example:* Slack sign-in — reach 1,200, impact 3, confidence 90%, effort 8 → (1200 × 3 × 0.9) ÷ 8 = **405**.

### MoSCoW

Sort scope into **Must have**, **Should have**, **Could have**, **Won't have (this time)**. Great for agreeing MVP scope with stakeholders.

### Kano model

Classifies features by how they affect satisfaction:

- **Basic** — expected; absence causes frustration (login works).
- **Performance** — more is better (faster sync).
- **Delighters** — unexpected joy (smart focus suggestions).

### Impact vs. effort matrix

Plot ideas on a 2×2: do **quick wins** (high impact, low effort) first, plan **big bets**, question **fill-ins**, avoid **money pits**.

### Choosing a framework

| Situation | Use |
|---|---|
| Ranking a long backlog | RICE |
| Agreeing MVP scope | MoSCoW |
| Understanding customer expectations | Kano |
| Quick team workshop | Impact vs. effort |

### Key takeaways

- Frameworks make trade-offs explicit; they're inputs to judgment, not answers.
- RICE is great for comparable, quantified backlogs.
- Revisit scores as you learn — confidence should change with evidence.
`,
      practice: { label: "Score your stories with live RICE", to: "/dashboard" },
      ask: [
        "Calculate RICE for three features I'll describe",
        "When is RICE a bad choice for prioritization?",
      ],
    },
    {
      slug: "roadmapping",
      title: "Roadmapping",
      summary: "Communicating direction with outcome-based, Now/Next/Later roadmaps.",
      minutes: 6,
      body: `
A **roadmap** communicates where the product is going and why. It's a **communication tool**, not a promise of dates.

### Types of roadmaps

| Type | Looks like | Best for |
|---|---|---|
| **Timeline** | Features on a Gantt chart with dates | Fixed commitments (e.g. compliance deadlines) |
| **Now / Next / Later** | Three columns by horizon | Most product teams — flexible and honest |
| **Outcome-based** | Goals ("reduce churn by 10%") with candidate bets | Empowered teams; aligns with OKRs |
| **Sprint plan** | Stories packed into sprints by capacity | Near-term delivery planning |

### Principles

1. **Lead with outcomes.** "Improve new-team activation" with candidate solutions beneath it.
2. **Fuzzier further out.** Now = committed and detailed; Later = themes and problems.
3. **Tie to strategy.** Every item should map to a strategic pillar.
4. **Tailor to the audience.** Executives want themes and outcomes; engineers want sequencing.

### Capacity-based sprint planning

For the next few sprints, take the prioritized backlog and fill each sprint up to the team's **capacity** (e.g. 30 story points). Larger items might need their own sprint — and might need to be split.

### Key takeaways

- Roadmaps communicate direction; avoid fake precision.
- Prefer Now/Next/Later or outcome-based roadmaps.
- For near-term delivery, plan sprints against real team capacity.
`,
      practice: { label: "Build a capacity-based sprint roadmap", to: "/dashboard" },
      ask: [
        "How do I say no to a stakeholder's roadmap request?",
        "Turn these goals into a Now/Next/Later roadmap",
      ],
    },
  ],
};
