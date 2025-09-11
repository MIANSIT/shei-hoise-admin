import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div
      className={`max-w-md mx-auto mt-10 p-6 border rounded-lg shadow-md ${"  border-yellow-700"}`}
    >
      <h1 className="text-3xl font-bold mb-6">Admin Login</h1>
      <LoginForm submitText="Super Admin" />
    </div>
  );
}
