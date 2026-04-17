"use client";

import { useAuth } from "@/hooks/use-auth";
import {
  describeLoginCodeError,
  describeSendCodeError,
} from "@/lib/auth-errors";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function LoginPage() {
  const { authenticated, ready, sendCode, loginWithCode } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await sendCode({ email });
      setStep("otp");
    } catch (err) {
      setError(describeSendCodeError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await loginWithCode({ code: otp });
      router.push("/");
    } catch (err) {
      setError(describeLoginCodeError(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="font-display text-primary text-3xl font-bold">
            WEALTH
          </h1>
          <p className="text-on-surface-variant mt-2">
            Masuk untuk mulai redeem voucher
          </p>
        </div>

        {step === "email" ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="text-on-surface-variant text-[10px] font-bold tracking-widest uppercase">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                className="bg-surface-container-high text-on-surface placeholder:text-outline focus:bg-surface-container-lowest focus:ring-primary mt-2 w-full rounded-[var(--radius-md)] px-4 py-3 transition-colors focus:ring-2 focus:outline-none"
              />
            </div>

            {error && <p className="text-error text-sm">{error}</p>}

            <button
              type="submit"
              disabled={isLoading || !email}
              className="from-primary to-primary-container text-on-primary font-display w-full rounded-full bg-gradient-to-r py-4 text-lg font-bold disabled:opacity-50"
            >
              {isLoading ? "Mengirim..." : "Kirim Kode OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <p className="text-on-surface-variant text-center text-sm">
              Kode OTP telah dikirim ke <strong>{email}</strong>
            </p>

            <div>
              <label className="text-on-surface-variant text-[10px] font-bold tracking-widest uppercase">
                Kode OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                required
                maxLength={6}
                className="bg-surface-container-high text-on-surface placeholder:text-outline focus:bg-surface-container-lowest focus:ring-primary mt-2 w-full rounded-[var(--radius-md)] px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] transition-colors focus:ring-2 focus:outline-none"
              />
            </div>

            {error && <p className="text-error text-sm">{error}</p>}

            <button
              type="submit"
              disabled={isLoading || otp.length < 6}
              className="from-primary to-primary-container text-on-primary font-display w-full rounded-full bg-gradient-to-r py-4 text-lg font-bold disabled:opacity-50"
            >
              {isLoading ? "Verifikasi..." : "Masuk"}
            </button>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setError("");
                }}
                className="text-on-surface-variant text-sm font-semibold"
              >
                Ganti Email
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={async () => {
                  setIsLoading(true);
                  setError("");
                  try {
                    await sendCode({ email });
                  } catch (err) {
                    setError(describeSendCodeError(err));
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="text-primary text-sm font-semibold disabled:opacity-50"
              >
                Kirim Ulang
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
