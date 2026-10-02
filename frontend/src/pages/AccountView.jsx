// /account — who you're signed in as, your learning progress at a glance, and a change-
// password form. Protected (rendered inside ProtectedRoute).
import { useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, KeyRound, LogOut, Sparkles } from "lucide-react";

import { apiErrorMessage } from "../api/client.js";
import Button from "../components/Button.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { CourseProgress } from "../learn/CourseSidebar.jsx";
import { useToast } from "../lib/toast.js";

export default function AccountView() {
  const { user, changePassword, logout } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);

  const mismatch = form.confirm && form.next !== form.confirm;
  const tooShort = form.next && form.next.length < 6;
  const canSave = form.current && form.next && form.confirm && !mismatch && !tooShort;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      await changePassword(form.current, form.next);
      setForm({ current: "", next: "", confirm: "" });
      toast.success("Password updated.");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not update the password."));
    } finally {
      setSaving(false);
    }
  }

  const field = (key, label, autoComplete) => (
    <div>
      <label className="label" htmlFor={key}>
        {label}
      </label>
      <input
        id={key}
        type="password"
        autoComplete={autoComplete}
        className="input"
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Account" title="Your account" description={`Signed in as ${user?.email ?? ""}`} />

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card space-y-5 p-6">
          <div className="flex items-center gap-3">
            <span className="icon-tile h-9 w-9">
              <GraduationCap size={16} />
            </span>
            <div>
              <h2 className="font-semibold text-heading">Learning</h2>
              <p className="text-sm text-muted">Your course progress and PM AI chat are saved to this account.</p>
            </div>
          </div>
          <CourseProgress />
          <div className="flex flex-wrap gap-2">
            <Link to="/learn" className="btn-secondary !py-2">
              <GraduationCap size={15} /> Continue the course
            </Link>
            <Link to="/ask" className="btn-secondary !py-2">
              <Sparkles size={15} className="text-grass-500" /> Open PM AI Chat
            </Link>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
          <div className="flex items-center gap-3">
            <span className="icon-tile h-9 w-9">
              <KeyRound size={16} />
            </span>
            <div>
              <h2 className="font-semibold text-heading">Change password</h2>
              <p className="text-sm text-muted">Signed up with Google? Keep using Google sign-in instead.</p>
            </div>
          </div>
          {field("current", "Current password", "current-password")}
          {field("next", "New password", "new-password")}
          {tooShort && <p className="field-error !-mt-2">At least 6 characters.</p>}
          {field("confirm", "Confirm new password", "new-password")}
          {mismatch && <p className="field-error !-mt-2">Passwords don&apos;t match.</p>}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <Button type="submit" loading={saving} disabled={!canSave}>
              Update password
            </Button>
            <Button variant="ghost-danger" onClick={logout}>
              <LogOut size={14} /> Log out
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
