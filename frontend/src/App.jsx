// Defines all routes. Public: / (landing), /login, /register, /learn (+ lessons), /ask.
// Protected (require login): /dashboard and /projects/:id (+ /stories, /roadmap,
// /workspace). Unknown paths redirect to /.
//
// Pages are code-split with React.lazy so each route ships as its own chunk — the browser
// only downloads the page it needs (e.g. the landing page doesn't pull in the PRD editor).
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import ErrorBoundary from "./components/ErrorBoundary.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Spinner from "./components/Spinner.jsx";
import { LearnProgressSync } from "./learn/useLearnProgress.js";

const Landing = lazy(() => import("./pages/Landing.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const ProjectView = lazy(() => import("./pages/ProjectView.jsx"));
const StoriesView = lazy(() => import("./pages/StoriesView.jsx"));
const RoadmapView = lazy(() => import("./pages/RoadmapView.jsx"));
const WorkspaceView = lazy(() => import("./pages/WorkspaceView.jsx"));
const LearnHome = lazy(() => import("./pages/LearnHome.jsx"));
const LessonView = lazy(() => import("./pages/LessonView.jsx"));
const AskView = lazy(() => import("./pages/AskView.jsx"));
const AccountView = lazy(() => import("./pages/AccountView.jsx"));

// Shown briefly while a route's chunk downloads.
function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center text-brand-500">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

export default function App() {
  // Re-key the error boundary on each navigation: moving to a new route remounts it, so a
  // crash on one page is automatically cleared when the user navigates elsewhere.
  const location = useLocation();
  return (
    <ErrorBoundary key={location.pathname}>
      <LearnProgressSync />
      <Suspense fallback={<PageLoader />}>
        <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/learn" element={<LearnHome />} />
        <Route path="/learn/:slug" element={<LessonView />} />
        <Route path="/ask" element={<AskView />} />

        {/* Protected: each is wrapped so unauthenticated users get bounced to /login. */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId"
          element={
            <ProtectedRoute>
              <ProjectView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId/stories"
          element={
            <ProtectedRoute>
              <StoriesView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId/roadmap"
          element={
            <ProtectedRoute>
              <RoadmapView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId/workspace"
          element={
            <ProtectedRoute>
              <WorkspaceView />
            </ProtectedRoute>
          }
        />

        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <AccountView />
            </ProtectedRoute>
          }
        />

        {/* Catch-all → the public landing page. */}
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
