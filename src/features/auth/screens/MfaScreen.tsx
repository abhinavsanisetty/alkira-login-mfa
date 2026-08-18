import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
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
        <h1 className="text-2xl font-semibold text-ink">Check your email</h1>
        <p className="mt-1 text-sm text-gray">
          We sent a {OTP_LENGTH} digit code to {challenge.email}.
        </p>

        <Card className="mt-5">
          <CardHeader>
            <span className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
              <Icon name="shield" className="text-royal" />
              Second factor
            </span>
            <span className="text-2xs font-semibold uppercase tracking-[0.07em] text-gray">
              Step 2 of 2
            </span>
          </CardHeader>

          <CardBody>
            <form
              onSubmit={handleSubmit(({ code }) => verify(code))}
              className="flex flex-col gap-4"
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

              <Button
                type="submit"
                variant="primary"
                block
                loading={pending}
                loadingLabel="Verifying"
              >
                Verify
              </Button>
            </form>
          </CardBody>
        </Card>

        <div className="mt-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" icon="mail" onClick={resend} disabled={pending}>
            Resend code
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut}>
            Back to sign in
          </Button>
        </div>
      </div>

      <MockInbox />
    </div>
  );
}
