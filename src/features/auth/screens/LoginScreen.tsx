import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useAuth } from "../useAuth";
import { loginSchema, type LoginInput } from "@/lib/schemas";

export function LoginScreen() {
  const { state, pending, signIn } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    // Validate on blur, then re-validate as they type once a field has been
    // touched. Validating from the first keystroke is hostile.
    mode: "onTouched",
  });

  const formError = state.status === "anonymous" ? state.error : undefined;

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl text-ink">Sign in</h1>
      <p className="mt-1.5 text-sm text-muted">
        Use one of the seeded accounts listed in the README.
      </p>

      <form onSubmit={handleSubmit(signIn)} className="mt-6 flex flex-col gap-4" noValidate>
        {formError ? <Alert>{formError.message}</Alert> : null}

        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          placeholder="editor@alkira.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />

        <Button type="submit" variant="primary" block loading={pending} loadingLabel="Signing in">
          Continue
        </Button>
      </form>

      <p className="mt-5 text-sm text-muted">
        No account?{" "}
        <Link to="/signup" className="font-medium text-royal underline underline-offset-2">
          Sign up
        </Link>
      </p>
    </div>
  );
}
