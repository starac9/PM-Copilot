// Register page. Mirror of Login — supplies the register handler and logs the user
// straight in on success (the backend returns a token from /auth/register).
import { useNavigate } from "react-router-dom";

import AuthForm, { Link } from "../components/AuthForm.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../lib/toast.js";
import { apiErrorMessage } from "../api/client.js";

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  async function handleRegister(email, password) {
    try {
      await register(email, password);
      toast.success("Account created.");
      navigate("/dashboard");
    } catch (error) {
      // e.g. "Email already registered."
      toast.error(apiErrorMessage(error, "Could not create account."));
    }
  }

  return (
    <AuthForm
      title="Create your account"
      subtitle="Start turning ideas into PRDs in seconds"
      submitLabel="Create account"
      onSubmit={handleRegister}
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Log in
          </Link>
        </>
      }
    />
  );
}
