// End-of-lesson check-your-understanding questions, keyed by lesson slug. `answer` is the
// index of the correct option; `why` is shown after checking, right or wrong.
export const QUIZZES = {
  "what-is-product-management": [
    {
      q: "What is a product manager primarily responsible for?",
      options: [
        "Writing most of the production code",
        "Deciding what to build, for whom, and why — then driving it to impact",
        "Managing the team's timelines and budget",
        "Designing every screen of the product",
      ],
      answer: 1,
      why: "PMs own the what and why. Engineers build, designers design, and project managers own schedules.",
    },
    {
      q: "Which is an OUTCOME rather than an OUTPUT?",
      options: [
        "Shipped 12 features this quarter",
        "Launched a new onboarding flow",
        "Increased week-4 retention from 30% to 38%",
        "Closed 40 Jira tickets",
      ],
      answer: 2,
      why: "Outcomes are changes in customer or business results. Shipping features is output.",
    },
  ],
  "role-of-a-product-manager": [
    {
      q: "Which question is the product manager's core concern (vs. a project manager's)?",
      options: [
        "Are we building it on schedule?",
        "Are we building the right thing?",
        "Is the budget approved?",
        "Who is on vacation next sprint?",
      ],
      answer: 1,
      why: "Project managers focus on delivery on time and budget; PMs focus on building the right product.",
    },
    {
      q: "How do PMs usually get things done?",
      options: [
        "Through formal authority over engineers and designers",
        "Through influence, clarity, and evidence",
        "By escalating every disagreement to executives",
        "By doing the work themselves",
      ],
      answer: 1,
      why: "PMs rarely manage the people they work with, so they lead through influence and evidence.",
    },
  ],
  "product-lifecycle": [
    {
      q: "What is the clearest signal of product–market fit?",
      options: [
        "A big launch on social media",
        "Total sign-ups going up",
        "Retention curves that flatten instead of falling to zero",
        "A long feature list",
      ],
      answer: 2,
      why: "If users keep coming back on their own, the product delivers real value to that market.",
    },
    {
      q: "In the maturity stage, a PM typically focuses on…",
      options: [
        "Finding product–market fit",
        "Retention, efficiency, and differentiation",
        "Shutting the product down",
        "Hiring the first engineer",
      ],
      answer: 1,
      why: "Growth slows and competition increases, so keeping customers and standing out matter most.",
    },
  ],
  "pm-skills-and-types": [
    {
      q: "Which PM type mainly runs experiments on acquisition, activation, and retention?",
      options: ["Platform PM", "Growth PM", "B2B PM", "Data/AI PM"],
      answer: 1,
      why: "Growth PMs optimize the funnel through rapid experimentation.",
    },
    {
      q: "What mainly increases as a PM moves up the career ladder?",
      options: [
        "Lines of code written",
        "Scope and the ambiguity they're trusted to handle",
        "Number of meetings attended",
        "Hours worked",
      ],
      answer: 1,
      why: "Seniority grows from a feature to a product to a portfolio — with more ambiguity at each step.",
    },
  ],
  "user-research": [
    {
      q: "Which interview question is most useful?",
      options: [
        "Would you use an app that does X?",
        "How much would you pay for X?",
        "Tell me about the last time you planned a sprint.",
        "Don't you think X would be great?",
      ],
      answer: 2,
      why: "Ask about real past behavior. People are poor at predicting what they'd do in the future.",
    },
    {
      q: "Product analytics is best described as…",
      options: [
        "Qualitative — what people say",
        "Quantitative — what people do",
        "Qualitative — what people do",
        "Quantitative — what people say",
      ],
      answer: 1,
      why: "Analytics measures actual behavior at scale; surveys measure what people say at scale.",
    },
  ],
  "problem-framing-jtbd": [
    {
      q: "In Jobs to be Done, a commuter who 'hires' a podcast to unwind could also hire…",
      options: [
        "Only other podcasts",
        "Music, a game, or nothing at all",
        "A faster train",
        "Nothing — podcasts have no competitors",
      ],
      answer: 1,
      why: "Anything that gets the same job done is a competitor, even in a different category.",
    },
    {
      q: "When should you write the problem statement?",
      options: [
        "After the solution is built",
        "Before discussing any solution",
        "Only if engineering asks for it",
        "At launch, for the press release",
      ],
      answer: 1,
      why: "Defining the problem precisely first prevents building the wrong thing.",
    },
  ],
  personas: [
    {
      q: "A useful persona is built mainly from…",
      options: [
        "Invented demographics",
        "Behaviors and needs observed in research",
        "The CEO's opinion",
        "Competitors' marketing",
      ],
      answer: 1,
      why: "Personas summarize real research — goals, pains, and context — not fiction.",
    },
    {
      q: "How many primary personas should the core experience be designed for?",
      options: ["One", "Every customer segment equally", "At least five", "None"],
      answer: 0,
      why: "Designing for everyone equally tends to delight no one. Pick one primary persona.",
    },
  ],
  "market-and-competition": [
    {
      q: "What does SOM stand for?",
      options: [
        "Serviceable Obtainable Market",
        "Standard Operating Model",
        "Share of Market",
        "Strategic Opportunity Map",
      ],
      answer: 0,
      why: "SOM is the part of the market you can realistically win soon.",
    },
    {
      q: "Which competitor should a competitive analysis include?",
      options: [
        "Only direct competitors in the same category",
        "Only the market leader",
        "Workarounds like spreadsheets, and 'doing nothing'",
        "Only companies with funding",
      ],
      answer: 2,
      why: "Whatever users do today to get the job done is your real competition.",
    },
  ],
  "vision-and-strategy": [
    {
      q: "Which structure does a good strategy follow (Rumelt)?",
      options: [
        "Goals → budget → timeline",
        "Diagnosis → guiding policy → coherent actions",
        "Vision → mission → values",
        "Features → launch → marketing",
      ],
      answer: 1,
      why: "A strategy diagnoses the challenge, picks an approach, and commits to coherent actions.",
    },
    {
      q: "Which is a sign of bad strategy?",
      options: [
        "Choosing a focused segment",
        "Saying what you won't do",
        "A list of goals with no choices",
        "Two to four strategic pillars",
      ],
      answer: 2,
      why: "'Grow users and delight customers' isn't a strategy — strategy requires choices.",
    },
  ],
  "metrics-and-okrs": [
    {
      q: "Which is a good key result?",
      options: [
        "Launch the onboarding checklist",
        "Raise new-team activation from 32% to 50%",
        "Hold three planning meetings",
        "Improve the product",
      ],
      answer: 1,
      why: "Key results measure outcomes. Launching something is a task, not a result.",
    },
    {
      q: "What are guardrail metrics for?",
      options: [
        "Replacing the North Star",
        "Making sure you don't win in a harmful way",
        "Tracking engineering velocity",
        "Marketing reports",
      ],
      answer: 1,
      why: "Guardrails (e.g. opt-outs, support tickets) catch growth that hurts users or the business.",
    },
  ],
  "business-models-pricing": [
    {
      q: "A common healthy benchmark for SaaS unit economics is…",
      options: ["LTV ÷ CAC ≥ 3", "CAC ÷ LTV ≥ 3", "Churn ≥ 10% per month", "LTV = CAC"],
      answer: 0,
      why: "Lifetime value should comfortably exceed the cost of acquiring the customer.",
    },
    {
      q: "Value-based pricing sets the price relative to…",
      options: [
        "Your costs plus a margin",
        "The value delivered to the customer",
        "The cheapest competitor",
        "What engineering estimates",
      ],
      answer: 1,
      why: "Customers pay for value received, not for what it cost you to build.",
    },
  ],
  "writing-a-prd": [
    {
      q: "Why include an explicit 'out of scope' list in a PRD?",
      options: [
        "To make the document longer",
        "To prevent scope creep and align expectations",
        "Because Jira requires it",
        "To hide features from stakeholders",
      ],
      answer: 1,
      why: "Writing down what you won't do keeps the MVP focused.",
    },
    {
      q: "Which is a well-written PRD success metric?",
      options: [
        "Improve engagement",
        "Users love it",
        "Increase weekly active teams from 1,200 to 1,500",
        "Ship on time",
      ],
      answer: 2,
      why: "Metrics must be measurable, with a baseline and a target.",
    },
  ],
  "user-stories": [
    {
      q: "In INVEST, the 'V' stands for…",
      options: ["Visible", "Valuable", "Versioned", "Verified"],
      answer: 1,
      why: "Every story should deliver value to a user.",
    },
    {
      q: "'Vertical slicing' means each story…",
      options: [
        "Covers one technical layer, like the database",
        "Delivers a thin end-to-end slice that can ship",
        "Is assigned to one engineer",
        "Lasts exactly one day",
      ],
      answer: 1,
      why: "Thin end-to-end slices (UI + API + data) are shippable and testable on their own.",
    },
  ],
  "prioritization-frameworks": [
    {
      q: "Reach 1,000 · Impact 2 · Confidence 50% · Effort 5. What's the RICE score?",
      options: ["200", "400", "1,000", "2,000"],
      answer: 0,
      why: "(1,000 × 2 × 0.5) ÷ 5 = 200.",
    },
    {
      q: "Which framework is best for agreeing MVP scope with stakeholders?",
      options: ["RICE", "MoSCoW", "Kano", "AARRR"],
      answer: 1,
      why: "Must / Should / Could / Won't is a simple shared language for scope decisions.",
    },
  ],
  roadmapping: [
    {
      q: "Which roadmap format is most honest for most product teams?",
      options: [
        "A Gantt chart with exact dates 12 months out",
        "Now / Next / Later",
        "A list of every requested feature",
        "No roadmap at all",
      ],
      answer: 1,
      why: "Detail where you're committed, themes further out — without fake precision.",
    },
    {
      q: "In capacity-based sprint planning, you fill each sprint…",
      options: [
        "With as many stories as possible",
        "Up to the team's capacity, in priority order",
        "With only the easiest stories",
        "With one story per engineer",
      ],
      answer: 1,
      why: "Prioritized stories are packed until the sprint's capacity is reached.",
    },
  ],
  "agile-and-scrum": [
    {
      q: "Velocity should be used as…",
      options: [
        "A planning tool",
        "A performance target for engineers",
        "A comparison between teams",
        "A bonus metric",
      ],
      answer: 0,
      why: "Turning velocity into a target just inflates estimates.",
    },
    {
      q: "What's the PM's highest-leverage backlog habit?",
      options: [
        "Adding every request to the backlog",
        "Keeping the top of the backlog ready before sprint planning",
        "Running the daily stand-up",
        "Estimating stories alone",
      ],
      answer: 1,
      why: "Clear, ready stories make sprint planning fast and delivery smooth.",
    },
  ],
  "working-with-engineering-and-design": [
    {
      q: "When time is short, what should you usually cut first?",
      options: ["Quality", "Scope", "Testing", "Code review"],
      answer: 1,
      why: "Cutting quality costs more later. Find the smallest version that still solves the problem.",
    },
    {
      q: "What builds the most trust with engineers?",
      options: [
        "Handing over detailed solutions",
        "Bringing problems and data, and involving them early",
        "Pushing back on every estimate",
        "Changing priorities often",
      ],
      answer: 1,
      why: "Engineers often find better or cheaper solutions when they understand the problem.",
    },
  ],
  "mvp-and-experimentation": [
    {
      q: "What is an MVP for?",
      options: [
        "A cheap first version to sell",
        "Testing your riskiest assumption as cheaply as possible",
        "Impressing investors",
        "Avoiding user research",
      ],
      answer: 1,
      why: "An MVP is an experiment designed for learning, not a stripped-down v1.",
    },
    {
      q: "A common A/B testing mistake is…",
      options: [
        "Writing a hypothesis first",
        "Computing sample size before starting",
        "Peeking and stopping early when results look good",
        "Adding guardrail metrics",
      ],
      answer: 2,
      why: "Stopping early on noise produces false winners.",
    },
  ],
  "go-to-market": [
    {
      q: "What does a 'beachhead' market mean?",
      options: [
        "The biggest possible market",
        "The first focused segment you target",
        "A market where you have no competitors",
        "A seasonal market",
      ],
      answer: 1,
      why: "Win a focused segment first, then expand.",
    },
    {
      q: "A small bug-fix release usually deserves…",
      options: [
        "A press event",
        "A sales training session",
        "Release notes / changelog (tier 3)",
        "A paid ad campaign",
      ],
      answer: 2,
      why: "Match launch effort to the importance of the release.",
    },
  ],
  "product-analytics": [
    {
      q: "In AARRR, which stage measures whether users reach the 'aha' moment?",
      options: ["Acquisition", "Activation", "Retention", "Referral"],
      answer: 1,
      why: "Activation is when new users first experience the core value.",
    },
    {
      q: "Which funnel leak should you fix first?",
      options: [
        "Always the first step",
        "The biggest leak most tied to long-term retention",
        "The one easiest to fix",
        "The last step",
      ],
      answer: 1,
      why: "Prioritize the drop-off that matters most for retained value.",
    },
  ],
  "iteration-and-feedback": [
    {
      q: "After measuring an experiment, which three decisions can you make?",
      options: [
        "Build, buy, or partner",
        "Persevere, iterate, or pivot",
        "Launch, delay, or cancel",
        "Hire, fire, or reorganize",
      ],
      answer: 1,
      why: "The build–measure–learn loop ends with an explicit decision.",
    },
    {
      q: "When should you consider removing a feature?",
      options: [
        "Never — features only get added",
        "When it has low usage, high maintenance cost, and no strategic role",
        "Whenever one customer complains",
        "After every release",
      ],
      answer: 1,
      why: "Every feature carries complexity costs; prune ones that don't earn their keep.",
    },
  ],
  "stakeholder-management": [
    {
      q: "Stakeholders with high influence AND high interest should be…",
      options: ["Monitored", "Kept informed", "Kept satisfied", "Managed closely"],
      answer: 3,
      why: "Meet them 1:1 regularly and pre-wire big decisions with them.",
    },
    {
      q: "What should a written update lead with?",
      options: [
        "A detailed history of the project",
        "The conclusion — a TL;DR",
        "A list of every task completed",
        "Questions for the reader",
      ],
      answer: 1,
      why: "Busy readers should get most of the value from the first few lines.",
    },
  ],
  "pm-interviews-and-career": [
    {
      q: "A key metric dropped 10%. What do you check first?",
      options: [
        "Competitors' launches",
        "Data issues — tracking bugs or definition changes",
        "The marketing budget",
        "Engineering velocity",
      ],
      answer: 1,
      why: "Rule out measurement problems before hunting for real-world causes.",
    },
    {
      q: "What does STAR stand for in behavioral interviews?",
      options: [
        "Strategy, Tactics, Actions, Results",
        "Situation, Task, Action, Result",
        "Skills, Talent, Ambition, Reach",
        "Story, Theme, Answer, Review",
      ],
      answer: 1,
      why: "Describe the situation and your task, what you did, and the quantified result.",
    },
  ],
};
