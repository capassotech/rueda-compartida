import { AuthFormWrapper } from "@/components/auth/auth-form-wrapper";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthFormWrapper
      title="Welcome Back!"
      description="Log in to your Rueda Compartida account."
    >
      <LoginForm />
    </AuthFormWrapper>
  );
}
