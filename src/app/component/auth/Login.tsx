import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto mt-10 p-6 border border-slate-200 dark:border-white/10 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-6 text-slate-900 dark:text-slate-100">Admin Login</h1>
      <LoginForm submitText="Super Admin" />
    </div>
  );
}
