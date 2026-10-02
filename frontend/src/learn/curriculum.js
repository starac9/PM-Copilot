// The "Learn PM" curriculum: ordered modules → ordered lessons (Markdown bodies). Pure data,
// so adding a lesson is just adding an object to a module file. Progress is tracked per
// browser (see useLearnProgress) because it's a personal reading convenience.
import career from "./modules/career.js";
import discovery from "./modules/discovery.js";
import execution from "./modules/execution.js";
import foundations from "./modules/foundations.js";
import launch from "./modules/launch.js";
import planning from "./modules/planning.js";
import strategy from "./modules/strategy.js";

export const MODULES = [foundations, discovery, strategy, planning, execution, launch, career];

// Flat, ordered list of lessons (each tagged with its module) for prev/next navigation.
export const LESSONS = MODULES.flatMap((module, moduleIndex) =>
  module.lessons.map((lesson, lessonIndex) => ({
    ...lesson,
    moduleId: module.id,
    moduleTitle: module.title,
    moduleNumber: moduleIndex + 1,
    number: `${moduleIndex + 1}.${lessonIndex + 1}`,
  }))
);

export const TOTAL_MINUTES = LESSONS.reduce((n, l) => n + l.minutes, 0);

export function findLesson(slug) {
  const index = LESSONS.findIndex((l) => l.slug === slug);
  if (index === -1) return null;
  return { lesson: LESSONS[index], prev: LESSONS[index - 1] ?? null, next: LESSONS[index + 1] ?? null };
}
