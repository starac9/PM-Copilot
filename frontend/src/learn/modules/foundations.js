// Module 1 — Foundations: what product management is, the PM role, and the product lifecycle.
export default {
  id: "foundations",
  title: "Foundations",
  description: "What product management is, what PMs actually do, and how products live and die.",
  icon: "BookOpen",
  lessons: [
    {
      slug: "what-is-product-management",
      title: "What is product management?",
      summary: "The discipline of deciding what to build, for whom, and why.",
      minutes: 6,
      body: `
Product management is the discipline of **deciding what to build, for whom, and why** — and then making sure it actually gets built and delivers value.

A product manager (PM) sits at the intersection of three areas:

| Area | The question it answers |
|---|---|
| **Business** | Will this make (or save) money and support our strategy? |
| **User experience** | Does this solve a real problem in a way people enjoy? |
| **Technology** | Can we build it, at reasonable cost and risk? |

A good PM doesn't need to be the best designer, engineer, or analyst in the room. Their job is to **connect** those people around the right problem.

### What a product actually is

A *product* is anything that delivers value to a user in exchange for something (money, attention, data, time). Spotify, a bank's mobile app, an internal HR tool, and an API sold to developers are all products.

### Why the role exists

Without someone owning the "why", teams tend to:

- build features because a loud customer or executive asked for them,
- ship things nobody uses,
- lose sight of the metric the business cares about.

The PM protects the team from those traps by keeping everyone focused on **outcomes** (customer and business results) over **output** (features shipped).

### Example

Imagine a food-delivery app where orders drop on rainy evenings. An engineer might propose faster servers; a marketer might propose a discount. A PM first asks *why* orders drop — and discovers through data that delivery times double in the rain, so customers abandon checkout. The right fix might be showing honest delivery estimates and rain-time incentives for couriers.

### Key takeaways

- Product management = deciding **what** to build and **why**, then driving it to impact.
- PMs balance business, user, and technical constraints.
- The PM's north star is **outcomes over output**.
`,
      practice: { label: "Create your first project in the workspace", to: "/dashboard" },
      ask: [
        "What's the difference between outcomes and output?",
        "Do product managers need to know how to code?",
      ],
    },
    {
      slug: "role-of-a-product-manager",
      title: "The role of a product manager",
      summary: "Day-to-day responsibilities, and how PMs differ from project managers and product owners.",
      minutes: 7,
      body: `
A PM is often described as the "CEO of the product" — but that's misleading. PMs rarely have authority over the people they work with. They lead through **influence, clarity, and evidence**.

### Core responsibilities

1. **Understand users and the market** — interviews, data, competitive research.
2. **Define the problem and the vision** — what we're solving and where we're heading.
3. **Prioritize** — decide what to do now, next, and never.
4. **Specify** — write PRDs and user stories that make the work clear.
5. **Collaborate on delivery** — unblock engineers and designers, make trade-offs.
6. **Launch and measure** — ship, track metrics, and iterate.
7. **Communicate** — keep stakeholders aligned on what's happening and why.

### PM vs. project manager vs. product owner

| Role | Focus | Key question |
|---|---|---|
| **Product manager** | The right product | *Are we building the right thing?* |
| **Project manager** | Delivery on time and budget | *Are we building it on schedule?* |
| **Product owner** (Scrum) | The backlog for one team | *Is the backlog ready and ordered?* |

In many companies the PM also acts as the product owner. Project management is a separate discipline focused on timelines, resources, and dependencies.

### A typical week

- Monday: review last week's metrics, plan the sprint with engineering.
- Tuesday–Wednesday: two customer interviews, refine designs with the designer.
- Thursday: write a PRD for next quarter's bet, review it with stakeholders.
- Friday: demo shipped work, share a written update, groom the backlog.

### Key takeaways

- PMs lead through influence, not authority.
- The job spans discovery → definition → delivery → measurement.
- Product manager ≠ project manager; the PM owns the *what* and *why*.
`,
      practice: { label: "Write a stakeholder update in the PM workspace", to: "/dashboard" },
      ask: [
        "How do PMs influence without authority?",
        "What does a product owner do in Scrum?",
      ],
    },
    {
      slug: "product-lifecycle",
      title: "The product lifecycle",
      summary: "Introduction, growth, maturity, decline — and what a PM focuses on in each stage.",
      minutes: 6,
      body: `
Every product moves through a lifecycle. What a PM should focus on changes dramatically between stages.

| Stage | What's happening | PM focus |
|---|---|---|
| **Introduction** | Few users, unproven value | Find product–market fit; talk to users constantly |
| **Growth** | Rapid adoption | Scale, onboarding, reliability, new segments |
| **Maturity** | Growth slows, competition is fierce | Retention, efficiency, differentiation, pricing |
| **Decline** | Usage falls | Sunset plans, migration, or reinvention |

### Product–market fit

*Product–market fit* (PMF) means you've built something a well-defined market genuinely wants. Signals:

- Users come back without being nudged (healthy **retention curves** that flatten, not fall to zero).
- Word-of-mouth drives a meaningful share of sign-ups.
- In the "Sean Ellis test", a large share of users say they'd be *very disappointed* without the product.

Before PMF, speed of learning matters more than polish. After PMF, the job shifts to scaling what works.

### Example

Early Instagram (as *Burbn*) was a check-in app. The team noticed users mostly used photo sharing with filters — so they cut everything else. That pivot is classic introduction-stage PM work: follow the evidence of what users actually value.

### Key takeaways

- Strategy depends on lifecycle stage — don't optimize pricing before you have PMF.
- Retention is the clearest signal of product–market fit.
- Mature products need differentiation and efficiency; declining ones need honest decisions.
`,
      practice: { label: "Generate a product strategy artifact", to: "/dashboard" },
      ask: [
        "How do I know if my product has product-market fit?",
        "What should a PM do when a product is in decline?",
      ],
    },
    {
      slug: "pm-skills-and-types",
      title: "PM skills and types of PMs",
      summary: "The core skill set, and the flavors of PM roles you'll see in job postings.",
      minutes: 6,
      body: `
### The core skill set

| Skill | What it looks like in practice |
|---|---|
| **Customer empathy** | Running interviews, spotting unmet needs, saying "show me" instead of guessing |
| **Analytical thinking** | Defining metrics, reading dashboards, sizing opportunities |
| **Prioritization** | Saying no (kindly) to good ideas so great ones get done |
| **Communication** | Clear docs, crisp updates, running productive meetings |
| **Technical literacy** | Understanding APIs, data models, and trade-offs well enough to ask good questions |
| **Leadership** | Creating alignment and momentum without formal authority |

You don't need all of these at expert level on day one. Most PMs start strong in one or two (often from a previous role in engineering, design, analytics, or support) and grow the rest.

### Types of PMs

- **Growth PM** — optimizes acquisition, activation, and retention through experiments.
- **Platform / technical PM** — builds APIs and internal platforms other teams depend on.
- **Data / AI PM** — owns ML-powered features; deals with model quality and data pipelines.
- **B2B / enterprise PM** — sells to companies; longer sales cycles, admin features, security.
- **Consumer PM** — large user bases, design-heavy, fast experimentation.

### Career ladder

Associate PM → PM → Senior PM → Group / Principal PM → Director → VP / CPO. Each step expands **scope** (feature → product → portfolio) and **ambiguity** you're trusted to handle.

### Key takeaways

- Empathy, analysis, prioritization, and communication are the foundation.
- Your background is an asset — lean on it while you build the other skills.
- PM roles vary a lot; read job descriptions for which flavor they want.
`,
      practice: { label: "Ask PM AI to build you a 90-day learning plan", to: "/ask?q=Build+me+a+90-day+plan+to+become+a+product+manager" },
      ask: [
        "How can an engineer transition into product management?",
        "What's the difference between a growth PM and a platform PM?",
      ],
    },
  ],
};
