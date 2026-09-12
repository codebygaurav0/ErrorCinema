import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../services/api";

function AdminLogin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      toast.error("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/login", form);
      const { token, user } = response.data;

      if (user?.role !== "admin") {
        toast.error("Admin access required");
        return;
      }

      localStorage.setItem("errorcinema_admin_token", token);
      localStorage.setItem(
        "errorcinema_admin_user",
        JSON.stringify(user)
      );

      toast.success("Admin login successful");
      navigate("/admin/dashboard");
    } catch (error) {
      console.error("Admin login error:", error);

      toast.error(
        error.response?.data?.message || "Invalid admin credentials"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-5 py-20 text-white">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600/10 text-red-500">
            <ShieldCheck size={34} />
          </div>

          <h1 className="text-3xl font-black">
            Error<span className="text-red-500">Cinema</span>
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Administrator Portal
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold">Admin Login</h2>
            <p className="mt-1 text-sm text-gray-500">
              Sign in to manage ErrorCinema.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Email
              </label>

              <div className="flex h-12 items-center rounded-lg border border-white/10 bg-zinc-900 px-3 focus-within:border-red-500">
                <Mail size={18} className="mr-3 shrink-0 text-gray-500" />

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="admin@errorcinema.com"
                  autoComplete="email"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Password
              </label>

              <div className="flex h-12 items-center rounded-lg border border-white/10 bg-zinc-900 px-3 focus-within:border-red-500">
                <LockKeyhole
                  size={18}
                  className="mr-3 shrink-0 text-gray-500"
                />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="ml-2 text-gray-500 transition hover:text-white"
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-lg bg-red-600 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 border-t border-white/10 pt-5 text-center">
            <Link
              to="/"
              className="text-sm text-gray-500 transition hover:text-white"
            >
              ? Back to ErrorCinema
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default AdminLogin;
