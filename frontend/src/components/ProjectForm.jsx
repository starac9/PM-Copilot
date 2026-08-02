// A form for creating a project (a product idea). Uses react-hook-form for state + a Zod
// resolver for validation, so field rules live in one schema (lib/schemas.js) and error
// messages render per-field. The parent owns what "submit" does (calls the API + closes it).
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Lightbulb } from "lucide-react";

import { projectFormSchema } from "../lib/schemas.js";
import Button from "./Button.jsx";

export default function ProjectForm({ onSubmit, onCancel, submitting }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(projectFormSchema),
    defaultValues: { title: "", description: "", target_audience: "" },
  });

  return (
    // handleSubmit validates first; onSubmit only runs with clean data matching the schema.
    <form onSubmit={handleSubmit(onSubmit)} className="card animate-fade-in-up space-y-4 p-6">
      <div className="flex items-center gap-3">
        <span className="logo-mark h-10 w-10">
          <Lightbulb size={18} strokeWidth={1.75} />
        </span>
        <div>
          <h2 className="font-semibold text-heading">New project</h2>
          <p className="text-sm text-muted">Describe your idea — the AI does the rest.</p>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="title">
          Product title
        </label>
        <input
          id="title"
          className="input"
          maxLength={200}
          placeholder="e.g. FocusFlow"
          {...register("title")}
        />
        {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
      </div>

      <div>
        <label className="label" htmlFor="description">
          Short description
        </label>
        <textarea
          id="description"
          className="input min-h-[80px]"
          placeholder="What does it do, in a sentence or two?"
          {...register("description")}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div>
        <label className="label" htmlFor="audience">
          Target audience
        </label>
        <input
          id="audience"
          className="input"
          placeholder="Who is it for? e.g. solo founders, PMs"
          {...register("target_audience")}
        />
        {errors.target_audience && (
          <p className="mt-1 text-xs text-red-600">{errors.target_audience.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          Create project
        </Button>
      </div>
    </form>
  );
}
