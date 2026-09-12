import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { login } from "../services/authService";

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const redirect = searchParams.get("redirect");
  const destination = redirect?.startsWith("/") && !redirect.startsWith("//")
    ? redirect
    : "/";

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.email.trim() || !form.password) {
      toast.error("Email and password are required.");
      return;
    }

    try {
      setLoading(true);
      const data = await login({
        email: form.email.trim(),
        password: form.password,
      });
      toast.success(data?.message || "Login successful");
      navigate(destination, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-5 py-20 text-white">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="text-3xl font-black">
            Error<span className="text-red-500">Cinema</span>
          </Link>
          <p className="mt-2 text-sm text-gray-500">Sign in to use your personal features.</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl sm:p-8">
          <h1 className="text-xl font-bold">Sign In</h1>
          <div className="mt-6 space-y-5">
            <label className="block text-sm font-medium text-gray-300">
              Email
              <span className="mt-2 flex min-h-12 items-center rounded-lg border border-white/10 bg-zinc-900 px-3 focus-within:border-red-500">
                <Mail size={18} className="mr-3 text-gray-500" />
                <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} autoComplete="email" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-600" placeholder="you@example.com" />
              </span>
            </label>
            <label className="block text-sm font-medium text-gray-300">
              Password
              <span className="mt-2 flex min-h-12 items-center rounded-lg border border-white/10 bg-zinc-900 px-3 focus-within:border-red-500">
                <LockKeyhole size={18} className="mr-3 text-gray-500" />
                <input type={showPassword ? "text" : "password"} value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} autoComplete="current-password" className="w-full bg-transparent text-sm text-white outline-none" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="ml-2 text-gray-500 hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </span>
            </label>
          </div>
          <button type="submit" disabled={loading} className="mt-6 flex min-h-12 w-full items-center justify-center rounded-lg bg-red-600 text-sm font-bold hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Signing in..." : "Sign In"}</button>
          <Link to="/" className="mt-5 block text-center text-sm text-gray-500 hover:text-white">Continue browsing without signing in</Link>
        </form>
      </div>
    </main>
  );
}

export default Login;
