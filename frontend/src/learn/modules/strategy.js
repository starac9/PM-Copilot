// Module 3 — Strategy: vision, metrics, and business models.
export default {
  id: "strategy",
  title: "Strategy & Metrics",
  description: "Set direction with a vision and strategy, then measure progress with the right metrics.",
  icon: "Compass",
  lessons: [
    {
      slug: "vision-and-strategy",
      title: "Product vision & strategy",
      summary: "Where you're going, and the choices that get you there.",
      minutes: 7,
      body: `
**Vision** is the destination. **Strategy** is the set of choices about how to get there — including what you won't do.

### Product vision

A vision describes the future you're creating for users, usually 2–5 years out. It should be inspiring, user-centric, and stable.

> *"Every remote team has a protected, shared rhythm of deep work."*

### Product strategy

Strategy turns vision into focus. A useful structure (adapted from Richard Rumelt's *Good Strategy / Bad Strategy*):

1. **Diagnosis** — what's the key challenge? *"Remote teams can't coordinate focus; individual tools don't help because interruptions are social."*
2. **Guiding policy** — the approach. *"Make focus a team-level ritual, not an individual habit."*
3. **Coherent actions** — what you'll do. *"Shared focus blocks, Slack integration, team analytics."*

### Strategic pillars

Most strategies boil down to 2–4 **pillars** — themes that guide the roadmap, e.g. *Team rituals*, *Zero-setup integrations*, *Proof of impact*. Every major initiative should map to a pillar; if it doesn't, question it.

### Bad strategy smells

- A list of goals with no choices ("grow users, increase revenue, delight customers").
- Fluffy language with no diagnosis.
- Trying to serve every segment at once.

### Key takeaways

- Vision = destination; strategy = focused choices to reach it.
- Diagnosis → guiding policy → coherent actions.
- Strategy is as much about what you **won't** do.
`,
      practice: { label: "Generate a product strategy in the workspace", to: "/dashboard" },
      ask: [
        "What's the difference between vision, mission, and strategy?",
        "Critique this strategy: grow fast and delight users",
      ],
    },
    {
      slug: "metrics-and-okrs",
      title: "Metrics, North Star & OKRs",
      summary: "Choosing metrics that matter and setting goals with OKRs.",
      minutes: 8,
      body: `
What gets measured gets managed — so measure the right things.

### The North Star Metric

A **North Star Metric (NSM)** captures the core value users get from your product, and predicts long-term business success.

| Product | Possible North Star |
|---|---|
| Spotify | Time spent listening |
| Airbnb | Nights booked |
| Slack | Messages sent within teams |
| A focus app | Weekly team focus hours protected |

A good NSM is a **leading indicator** of revenue, reflects **user value**, and is **actionable** by the team.

### Input metrics and guardrails

- **Input metrics** are levers that drive the NSM (e.g. *teams activated*, *focus blocks scheduled per team*).
- **Guardrail metrics** make sure you don't win in a harmful way (e.g. *notification opt-outs*, *support tickets*).

### Vanity vs. actionable metrics

*Total sign-ups* only goes up and hides problems. *Week-4 retention of new teams* tells you whether people get value.

### OKRs

**Objectives and Key Results** set ambitious, measurable goals for a period (usually a quarter).

- **Objective** — qualitative and inspiring: *"New teams reach their first focus win in week one."*
- **Key results** — 2–4 measurable outcomes:
  - Activation (first team focus block) from 32% → 50%
  - Median time-to-first-block from 3 days → 1 day
  - Week-4 team retention from 40% → 48%

Key results measure **outcomes**, not tasks. "Launch onboarding checklist" is a task, not a KR.

### Key takeaways

- Pick one North Star that reflects user value; support it with input and guardrail metrics.
- Avoid vanity metrics.
- OKRs: inspiring objective + measurable outcome-based key results.
`,
      practice: { label: "Generate OKRs & metrics for your product", to: "/dashboard" },
      ask: [
        "Help me choose a North Star metric for a marketplace",
        "Why is 'launch feature X' a bad key result?",
      ],
    },
    {
      slug: "business-models-pricing",
      title: "Business models & pricing basics",
      summary: "How products make money, and the unit economics PMs should understand.",
      minutes: 7,
      body: `
Great products still need a working business model.

### Common models

| Model | Examples | PM considerations |
|---|---|---|
| **Subscription (SaaS)** | Notion, Netflix | Retention and expansion matter more than acquisition |
| **Freemium** | Spotify, Slack | The free tier must create value *and* a reason to upgrade |
| **Marketplace** | Airbnb, Uber | Balance supply and demand; take rate |
| **Transactional** | E-commerce | Conversion and average order value |
| **Advertising** | Google, Instagram | Attention and engagement; user trust |
| **Usage-based** | AWS, Twilio | Pricing aligned to value; revenue can be volatile |

### Unit economics

- **CAC** (Customer Acquisition Cost) — total sales & marketing spend ÷ new customers.
- **LTV** (Lifetime Value) — average revenue per customer × gross margin × expected lifetime.
- A common rule of thumb: **LTV ÷ CAC ≥ 3** and CAC payback under ~12 months for SaaS.
- **Churn** — the % of customers (or revenue) lost per period. Small changes compound massively.

### Pricing basics

1. **Value-based pricing** — price relative to the value delivered, not your costs.
2. **Value metric** — charge per unit that grows with value (seats, usage, projects).
3. **Packaging** — tiers (Good / Better / Best) built around different personas.
4. **Test carefully** — talk to customers about willingness to pay before changing prices.

### Key takeaways

- The business model shapes which metrics matter most.
- Know CAC, LTV, and churn — they decide whether growth is healthy.
- Price on value, using a value metric that scales with your customers' success.
`,
      practice: { label: "Ask PM AI to compare freemium vs free trial", to: "/ask?q=Freemium+vs+free+trial%3A+which+should+I+choose+and+why%3F" },
      ask: [
        "Explain LTV to CAC with a worked example",
        "How do I choose a value metric for pricing?",
      ],
    },
  ],
};
