import { LoginForm } from "./LoginForm";
import { BrandLogo } from "../common/BrandLogo";

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto mt-10 p-6 border border-slate-200 dark:border-white/10 rounded-lg shadow-md">
      <div className="flex justify-center mb-4">
        <BrandLogo height={96} className="dark:bg-white dark:rounded-2xl dark:p-2" />
      </div>
      <h1 className="text-3xl font-bold mb-6 text-slate-900 dark:text-slate-100">Admin Login</h1>
      <LoginForm submitText="Super Admin" />
    </div>
  );
}
