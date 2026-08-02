// Zod schemas — the single source of truth for the SHAPE of data at two boundaries:
//
//   1. API responses: we `.parse()` server payloads inside the React Query hooks, so a
//      backend change or a bad response fails loudly HERE (with a clear path) instead of
//      surfacing later as a cryptic "cannot read property of undefined" deep in the UI.
//   2. Forms: react-hook-form uses these (via @hookform/resolvers/zod) to validate input
//      before we ever hit the network, and to render field-level error messages.
//
// Keeping both in one file means the frontend's understanding of the data never drifts
// between "what we send" and "what we render".
import { z } from "zod";

// ---- Forms -----------------------------------------------------------------

// Login/Register: mirrors the backend's rules (valid email, password >= 6 chars).
export const credentialsSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

// New project form. Field names match the backend's ProjectCreate schema.
export const projectFormSchema = z.object({
  title: z.string().trim().min(1, "Give your product a title.").max(200),
  description: z.string().trim().min(1, "Add a short description."),
  target_audience: z.string().trim().min(1, "Who is this for?"),
});

// ---- API responses ---------------------------------------------------------

export const projectSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  target_audience: z.string(),
  has_prd: z.boolean(),
  created_at: z.string(),
});
export const projectListSchema = z.array(projectSchema);

// PRD content — the five sections the backend's PRDContent guarantees.
export const prdContentSchema = z.object({
  problem_statement: z.string(),
  personas: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      pain_points: z.array(z.string()),
    })
  ),
  success_metrics: z.array(z.string()),
  scope: z.object({
    in_scope: z.array(z.string()),
    out_of_scope: z.array(z.string()),
  }),
  risks_and_assumptions: z.array(z.string()),
});
export const prdSchema = z.object({ content: prdContentSchema });

// User stories (RICE inputs are numbers; the score itself is computed, never stored).
const storySchema = z.object({
  title: z.string(),
  description: z.string(),
  acceptance_criteria: z.array(z.string()),
  reach: z.number(),
  impact: z.number(),
  confidence: z.number(),
  effort: z.number(),
});
export const storySetContentSchema = z.object({
  epics: z.array(z.object({ name: z.string(), stories: z.array(storySchema) })),
});
export const storySetSchema = z.object({ content: storySetContentSchema });

// Roadmap: sprints of stories, produced deterministically on the server. Field names mirror
// the backend's Sprint/RoadmapStory schemas exactly (note `total_effort`, not total_points).
const roadmapStorySchema = z.object({
  epic: z.string(),
  title: z.string(),
  effort: z.number(),
  rice_score: z.number(),
  priority: z.string(),
});
export const roadmapSchema = z.object({
  capacity: z.number(),
  sprints: z.array(
    z.object({
      number: z.number(),
      stories: z.array(roadmapStorySchema),
      total_effort: z.number(),
    })
  ),
});

export const documentSchema = z.object({
  id: z.number(),
  project_id: z.number(),
  filename: z.string(),
  chunk_count: z.number(),
  created_at: z.string(),
});
export const documentListSchema = z.array(documentSchema);

// PM artifacts (strategy, market, OKRs, GTM, …) — all share this uniform shape.
export const artifactContentSchema = z.object({
  summary: z.string(),
  sections: z.array(z.object({ title: z.string(), body: z.array(z.string()) })),
});
export const artifactSchema = z.object({
  id: z.number(),
  project_id: z.number(),
  type: z.string(),
  title: z.string(),
  content: artifactContentSchema,
  created_at: z.string(),
  updated_at: z.string(),
});
export const workspaceSchema = z.object({
  catalog: z.array(z.object({ key: z.string(), label: z.string(), description: z.string() })),
  generated: z.array(
    z.object({ type: z.string(), title: z.string(), summary: z.string(), updated_at: z.string() })
  ),
});
