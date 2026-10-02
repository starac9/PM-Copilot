// Login page. Thin wrapper around the shared AuthForm — it only supplies the login
// handler and redirects to the dashboard on success.
import { useNavigate } from "react-router-dom";

import AuthForm, { Link } from "../components/AuthForm.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../lib/toast.js";
import { apiErrorMessage } from "../api/client.js";

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  async function handleLogin(email, password) {
    try {
      await login(email, password);
      toast.dismiss(); // clear any earlier "wrong password" error
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (error) {
      // Show the server's message (e.g. "Incorrect email or password.").
      toast.error(apiErrorMessage(error, "Login failed."));
    }
  }

  return (
    <AuthForm
      title="Welcome back"
      subtitle="Log in to your PM Copilot workspace"
      submitLabel="Log in"
      onSubmit={handleLogin}
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
            Create one
          </Link>
        </>
      }
    />
  );
}
