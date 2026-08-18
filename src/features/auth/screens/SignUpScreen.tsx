import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { TextField } from "@/components/ui/TextField";
import { signUpSchema, type SignUpInput } from "@/lib/schemas";

/** A separate screen with a real, validated form. Submitting says plainly that
 *  registration is not implemented rather than faking success. */
export function SignUpScreen() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({ resolver: zodResolver(signUpSchema), mode: "onTouched" });

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold text-ink">Create an account</h1>
      <p className="mt-1 text-sm text-gray">
        The form validates for real. Registration itself is out of scope for this exercise.
      </p>

      <Card className="mt-5">
        <CardHeader>
          <span className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
            <Icon name="mail" className="text-royal" />
            Your details
          </span>
        </CardHeader>

        <CardBody>
          <form
            onSubmit={handleSubmit(() => setSubmitted(true))}
            className="flex flex-col gap-4"
            noValidate
          >
            {submitted ? (
              <Alert tone="info" title="Validation passed">
                Registration is not implemented in this exercise, so no account was created.
              </Alert>
            ) : null}

            <TextField
              label="Name"
              autoComplete="name"
              autoFocus
              error={errors.name?.message}
              {...register("name")}
            />
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />
            <TextField
              label="Password"
              type="password"
              autoComplete="new-password"
              hint="At least 8 characters"
              error={errors.password?.message}
              {...register("password")}
            />
            <TextField
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />

            <Button type="submit" variant="primary" block>
              Create account
            </Button>
          </form>
        </CardBody>
      </Card>

      <p className="mt-5 text-sm text-gray">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-royal underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </div>
  );
}
