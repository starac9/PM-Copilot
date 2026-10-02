// Module 6 — Launch & growth: go-to-market, analytics, iteration.
export default {
  id: "launch",
  title: "Launch & Growth",
  description: "Bring products to market, measure what happens, and keep improving.",
  icon: "TrendingUp",
  lessons: [
    {
      slug: "go-to-market",
      title: "Go-to-market (GTM)",
      summary: "Planning a launch: audience, positioning, channels, and launch tiers.",
      minutes: 7,
      body: `
A **go-to-market plan** describes how a product or feature reaches its customers. Great products can still fail with no plan to get them in front of the right people.

### The GTM building blocks

1. **Target audience** — which segment first? (Your *beachhead* market.)
2. **Positioning & messaging** — the one-line value proposition and proof points.
3. **Channels** — how you'll reach them: product-led (in-app, viral loops), sales-led, content/SEO, communities, partnerships, paid ads.
4. **Pricing & packaging** — which tier gets it?
5. **Enablement** — sales decks, support docs, FAQs, demo videos.
6. **Launch metrics** — adoption, activation, revenue, support load.

### Launch tiers

Not every release deserves a big launch:

| Tier | Example | Activities |
|---|---|---|
| **Tier 1** | New product or major capability | Press, event, campaign, sales training |
| **Tier 2** | Notable feature | Blog post, email, in-app announcement |
| **Tier 3** | Improvement or fix | Release notes, changelog |

### Phased rollouts

Reduce risk with **alpha → beta → general availability (GA)**, often behind feature flags. Watch metrics and support tickets at each step.

### Key takeaways

- Choose a beachhead segment and sharp message before picking channels.
- Match launch effort to the release's importance.
- Roll out in phases and watch metrics at each step.
`,
      practice: { label: "Generate a go-to-market plan", to: "/dashboard" },
      ask: [
        "Product-led vs sales-led growth: what's the difference?",
        "Write a launch checklist for a B2B feature",
      ],
    },
    {
      slug: "product-analytics",
      title: "Product analytics",
      summary: "Funnels, retention cohorts, and the AARRR framework.",
      minutes: 8,
      body: `
Analytics tells you what users **do**. PMs use it to find problems, size opportunities, and measure impact.

### AARRR — "pirate metrics"

| Stage | Question | Example metric |
|---|---|---|
| **Acquisition** | Do people find us? | Sign-ups per week by channel |
| **Activation** | Do they reach the "aha" moment? | % of new teams scheduling a focus block in week 1 |
| **Retention** | Do they come back? | Week-4 team retention |
| **Referral** | Do they tell others? | Invites sent per active team |
| **Revenue** | Do they pay? | Free → paid conversion, ARPU |

### Funnels

A **funnel** shows drop-off between steps (visit → sign up → create team → first block). Fix the **biggest leak** that's most correlated with long-term retention, not just the first one you see.

### Retention cohorts

Group users by sign-up week and track how many remain active over time. A healthy product's curve **flattens**; a curve that slides toward zero means you haven't found product–market fit for that segment.

### Good analytics habits

- Define events and metrics *before* launch (a tracking plan).
- Segment everything: new vs. returning, plan, platform, persona.
- Pair numbers with qualitative research — data shows *what*, interviews explain *why*.

### Key takeaways

- AARRR gives a full-funnel view of growth.
- Retention cohorts are the truth-teller for product–market fit.
- Combine quantitative data with qualitative insight.
`,
      practice: { label: "Ask PM AI to design a tracking plan", to: "/ask?q=Design+an+analytics+tracking+plan+for+a+team+productivity+app" },
      ask: [
        "How do I find the 'aha moment' for my product?",
        "What's a good retention rate for a SaaS product?",
      ],
    },
    {
      slug: "iteration-and-feedback",
      title: "Iteration & feedback loops",
      summary: "Closing the loop after launch: feedback, release notes, and deciding what's next.",
      minutes: 5,
      body: `
Launch is the start of learning, not the finish line.

### The build–measure–learn loop

1. **Build** the smallest change that tests a hypothesis.
2. **Measure** its effect on the target metric and guardrails.
3. **Learn** — decide to **persevere**, **iterate**, or **pivot**, and write down why.

### Collecting feedback

- **In-app prompts** at the moment of use (short, contextual).
- **Support tickets and sales calls** — tag and count recurring themes.
- **NPS / CSAT** surveys — useful for trends; read the comments, not just the score.
- **Follow-up interviews** with users who adopted (and those who didn't).

### Closing the loop

- Tell users when you've shipped what they asked for — it builds loyalty.
- Publish **release notes** that explain the benefit, not the implementation.
- Share results with the team, including failures; it improves the next bet.

### When to stop investing

Kill or sunset features that have low usage, high maintenance cost, and no strategic role. Every feature has a carrying cost in complexity.

### Key takeaways

- Treat every launch as an experiment with a decision at the end.
- Feedback is most useful when categorized and counted.
- Close the loop with users and the team; prune features that don't earn their keep.
`,
      practice: { label: "Generate release notes for your product", to: "/dashboard" },
      ask: [
        "How do I decide whether to pivot or persevere?",
        "How do I say no to a customer feature request politely?",
      ],
    },
  ],
};
