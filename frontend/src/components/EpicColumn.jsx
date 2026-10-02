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
      <div className="flex items-center gap-2.5 border-b border-dashed border-slate-200 pb-3 dark:border-slate-800">
        <span className="logo-mark h-7 w-7">
          <Layers size={14} strokeWidth={1.75} />
        </span>
        <h3 className="min-w-0 truncate text-sm font-semibold text-heading">{epic.name}</h3>
        <span className="badge badge-neutral font-mono">{epic.stories.length}</span>
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
