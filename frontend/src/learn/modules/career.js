// Module 7 — Career: stakeholders, communication, interviews.
export default {
  id: "career",
  title: "Leadership & Career",
  description: "Stakeholder management, communication, and landing (and growing in) a PM job.",
  icon: "Users",
  lessons: [
    {
      slug: "stakeholder-management",
      title: "Stakeholder management & communication",
      summary: "Mapping stakeholders, writing great updates, and saying no.",
      minutes: 7,
      body: `
A PM's success depends on many people they don't manage: executives, sales, support, marketing, legal, other teams.

### Stakeholder mapping

Plot stakeholders by **influence** and **interest**:

| | Low interest | High interest |
|---|---|---|
| **High influence** | Keep satisfied | Manage closely |
| **Low influence** | Monitor | Keep informed |

Meet the "manage closely" group 1:1 regularly, and **pre-wire** big decisions with them before the meeting.

### Writing a great update

Use a predictable format:

1. **TL;DR** — one or two sentences.
2. **Progress** against goals (with metrics).
3. **Risks & blockers** — and what you need from the reader.
4. **Next steps.**

Lead with the conclusion. Busy readers should get 80% of the value from the first three lines.

### Saying no

You'll say no far more than yes. Do it with respect and reasoning:

> "That's a real problem for those customers. Right now we're focused on activation because it's our biggest lever for the quarter's goal. I've added this to the backlog with the details you shared, and I'll revisit it at next quarter's planning."

### Key takeaways

- Map stakeholders by influence and interest; give each group the right attention.
- Updates: conclusion first, metrics, risks, asks.
- Say no by connecting decisions to goals and strategy.
`,
      practice: { label: "Generate a stakeholder update in the workspace", to: "/dashboard" },
      ask: [
        "How do I manage an executive who keeps changing priorities?",
        "Review my weekly update format",
      ],
    },
    {
      slug: "pm-interviews-and-career",
      title: "PM interviews & career growth",
      summary: "Interview question types, how to answer them, and building a portfolio.",
      minutes: 9,
      body: `
### Common PM interview types

| Type | Example question | What they assess |
|---|---|---|
| **Product sense / design** | "Design a product for elderly people to stay connected." | User empathy, structured creativity |
| **Product improvement** | "How would you improve Google Maps?" | Prioritization, user focus |
| **Metrics / analytics** | "Instagram story views dropped 10%. Why?" | Analytical rigor, root-cause thinking |
| **Estimation** | "How many EV chargers are in your city?" | Structured reasoning |
| **Strategy** | "Should Spotify enter audiobooks?" | Business judgment |
| **Behavioral** | "Tell me about a time you disagreed with engineering." | Leadership, collaboration |

### A structure for product design questions

1. **Clarify** the goal and constraints.
2. **Pick a user segment** and explain why.
3. **List pain points**, then prioritize one.
4. **Brainstorm solutions**; pick one with clear reasoning.
5. **Define success metrics** and risks.

### Answering metric drops

Check **data issues** first (tracking bug? definition change?), then segment by **time, platform, geography, user type**, then consider **internal changes** (releases, experiments) and **external factors** (seasonality, competitors, outages).

### Behavioral answers: STAR

**S**ituation → **T**ask → **A**ction → **R**esult. Quantify the result and say what you learned.

### Breaking into PM

- Do PM work where you are: own a feature, run user interviews, write specs.
- Build a portfolio: a case study with problem, research, PRD, metrics, and outcome. (You can create the PRD, stories, and roadmap for a portfolio case study in this app's workspace.)
- Consider APM programs or internal transfers — often easier than external hires.

### Key takeaways

- Learn the main interview types and use a clear structure for each.
- For metric drops, rule out data issues first, then segment.
- Show PM work through a concrete portfolio case study.
`,
      practice: { label: "Practice a mock interview with PM AI", to: "/ask?q=Give+me+a+product+design+interview+question+and+evaluate+my+answer+step+by+step" },
      ask: [
        "Give me a metrics interview question and grade my answer",
        "How do I build a PM portfolio with no PM experience?",
      ],
    },
  ],
};
