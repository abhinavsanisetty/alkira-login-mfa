import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { MockInbox } from "../MockInbox";
import { useAuth } from "../useAuth";
import { OTP_LENGTH } from "@/lib/constants";
import { mfaSchema, type MfaInput } from "@/lib/schemas";

export function MfaScreen() {
  const { state, pending, verify, resend, signOut } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MfaInput>({ resolver: zodResolver(mfaSchema), mode: "onTouched" });

  // The route guard guarantees this, but narrowing keeps the compiler honest.
  if (state.status !== "awaitingMfa") return null;
  const { challenge, error } = state;

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6 lg:flex-row lg:items-start">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl text-ink">Check your email</h1>
        <p className="mt-1.5 text-sm text-muted">
          We sent a {OTP_LENGTH}-digit code to {challenge.email}.
        </p>

        <form
          onSubmit={handleSubmit(({ code }) => verify(code))}
          className="mt-6 flex flex-col gap-4"
          noValidate
        >
          {error ? <Alert>{error.message}</Alert> : null}

          <TextField
            label="Verification code"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            font="mono"
            maxLength={OTP_LENGTH}
            placeholder="000000"
            hint={`${challenge.attemptsRemaining} attempt${challenge.attemptsRemaining === 1 ? "" : "s"} remaining`}
            error={errors.code?.message}
            {...register("code")}
          />

          <Button type="submit" variant="primary" block loading={pending} loadingLabel="Verifying">
            Verify
          </Button>

          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={resend} disabled={pending}>
              Resend code
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              Back to sign in
            </Button>
          </div>
        </form>
      </div>

      <MockInbox />
    </div>
  );
}
