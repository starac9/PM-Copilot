// Module 5 — Execution: agile delivery, working with the team, MVPs and experiments.
export default {
  id: "execution",
  title: "Execution & Delivery",
  description: "Ship with your team: agile and Scrum, working with engineering and design, MVPs and experiments.",
  icon: "Rocket",
  lessons: [
    {
      slug: "agile-and-scrum",
      title: "Agile & Scrum for PMs",
      summary: "Sprints, ceremonies, and the PM's role in an agile team.",
      minutes: 7,
      body: `
**Agile** is a mindset: deliver in small increments, learn from feedback, and adapt. **Scrum** and **Kanban** are popular ways to practice it.

### Scrum in one table

| Element | What it is | PM's role |
|---|---|---|
| **Sprint** | A fixed 1–2 week cycle | Bring a clear goal for each sprint |
| **Backlog** | Ordered list of work | Own its priority and readiness |
| **Sprint planning** | Choose work for the sprint | Explain the *why*; negotiate scope |
| **Daily stand-up** | 15-min sync | Listen for blockers; don't run it as a status report |
| **Sprint review** | Demo what was built | Collect stakeholder feedback |
| **Retrospective** | Improve how the team works | Participate as a peer |

### Kanban

Kanban uses a continuous flow board (To do → In progress → Done) with **work-in-progress limits**. Good for teams with unpredictable incoming work (support, platform).

### Story points and velocity

- **Story points** are relative estimates of effort and complexity (often Fibonacci: 1, 2, 3, 5, 8, 13).
- **Velocity** is the points a team completes per sprint — useful for planning, useless as a performance target.

### Backlog refinement

The single highest-leverage PM habit: keep the top of the backlog **ready** — clear stories, acceptance criteria, designs linked, questions answered — *before* sprint planning.

### Key takeaways

- Agile = small increments + fast feedback.
- The PM owns backlog priority and readiness, not the team's process.
- Never weaponize velocity; it's a planning tool.
`,
      practice: { label: "Plan sprints against your team's capacity", to: "/dashboard" },
      ask: [
        "What makes a good sprint goal?",
        "Scrum vs Kanban: which should my team use?",
      ],
    },
    {
      slug: "working-with-engineering-and-design",
      title: "Working with engineering & design",
      summary: "The product trio, trade-off conversations, and earning trust.",
      minutes: 6,
      body: `
Modern teams work as a **product trio**: PM, designer, and tech lead jointly own discovery and delivery.

### What each brings

| Role | Owns | Ask them about |
|---|---|---|
| **PM** | Value and viability | *Is this worth building? Does it fit the strategy?* |
| **Designer** | Usability and desirability | *Will users understand and want this?* |
| **Tech lead** | Feasibility | *Can we build it? What are the risks and costs?* |

### Habits that build trust

- **Bring problems, not solutions.** "Teams abandon onboarding at step 3 — here's the data" invites better ideas than "add a tooltip".
- **Involve engineers early.** They often know a cheaper path or a hidden risk.
- **Protect the team** from thrash: batch requests, shield them from shifting priorities.
- **Make decisions visible.** Write down what was decided and why.
- **Respect estimates.** If something is bigger than hoped, cut scope, don't pressure.

### Trade-off conversations

When time is short, you can adjust **scope**, **quality**, or **time** — but cutting quality usually costs more later. The best lever is usually scope: *what's the smallest version that still solves the core problem?*

### Key takeaways

- PM + design + engineering share ownership as a trio.
- Share problems and context; involve engineers from discovery.
- When squeezed, cut scope before quality.
`,
      practice: { label: "Ask PM AI how to handle a scope disagreement", to: "/ask?q=My+tech+lead+says+a+feature+will+take+3x+longer+than+expected.+What+should+I+do%3F" },
      ask: [
        "How technical do I need to be to earn engineers' trust?",
        "How do I handle a disagreement with my designer?",
      ],
    },
    {
      slug: "mvp-and-experimentation",
      title: "MVPs & experimentation",
      summary: "Testing your riskiest assumptions cheaply, and running A/B tests.",
      minutes: 8,
      body: `
### The MVP

A **Minimum Viable Product** is the smallest thing you can build to **learn** whether your riskiest assumption is true. It's an experiment, not a cheap v1.

Types of MVPs, from cheapest to most expensive:

| MVP type | Example |
|---|---|
| **Fake door** | A "Try team focus" button that measures clicks before the feature exists |
| **Landing page** | Describe the product; measure sign-ups |
| **Concierge** | Deliver the service manually for 10 customers |
| **Wizard of Oz** | Looks automated; humans work behind the scenes |
| **Single-feature product** | Build only the core job, nothing else |

### Riskiest assumption first

List your assumptions (*teams will pay*, *leads will schedule blocks weekly*, *Slack integration is technically possible*), rank by **risk × uncertainty**, and test the top one first.

### A/B testing basics

1. **Hypothesis** — "Showing a setup checklist will increase activation because users don't know the next step."
2. **Primary metric** — activation within 7 days. Add guardrails (support tickets, churn).
3. **Sample size** — compute it *before* starting so you don't stop early on noise.
4. **Run, then decide** — at the planned sample size, check statistical significance and practical impact.

Common pitfalls: peeking and stopping early, testing too many variants, and ignoring novelty effects.

### Key takeaways

- An MVP is the cheapest test of your riskiest assumption.
- Write the hypothesis and success metric before the experiment.
- Pre-compute sample size; don't stop tests early.
`,
      practice: { label: "Generate a discovery plan with experiments", to: "/dashboard" },
      ask: [
        "Design an A/B test for a new onboarding flow",
        "What's the difference between an MVP and a prototype?",
      ],
    },
  ],
};
