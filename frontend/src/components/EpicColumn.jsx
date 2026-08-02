// One epic and its stories, rendered as a column on the stories board. Stories are shown
// sorted by RICE score (highest first) so the most valuable work is always at the top.
//
// We pair each story with its ORIGINAL index before sorting, so when a card edits a RICE
// value we can update the correct story in the unsorted source array.
import { Layers } from "lucide-react";

import { riceScore } from "../utils/rice.js";
import StoryCard from "./StoryCard.jsx";

export default function EpicColumn({ epic, onStoryChange }) {
  const ordered = epic.stories
    .map((story, index) => ({ story, index }))
    .sort((a, b) => riceScore(b.story) - riceScore(a.story));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
          <Layers size={14} strokeWidth={1.75} />
        </span>
        <h3 className="text-sm font-bold uppercase tracking-wide text-body">{epic.name}</h3>
        <span className="badge bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          {epic.stories.length}
        </span>
      </div>
      {ordered.map(({ story, index }) => (
        <StoryCard
          key={index}
          story={story}
          onChange={(updated) => onStoryChange(index, updated)}
        />
      ))}
    </div>
  );
}
