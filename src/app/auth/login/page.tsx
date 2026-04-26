"use client";

import { useAuth } from "@/hooks/use-auth";
import {
  describeLoginCodeError,
  describeSendCodeError,
} from "@/lib/auth-errors";
import Image from "next/image";
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
        <div className="flex flex-col items-center text-center">
          <Image
            src="/image/logo.png"
            alt="WEALTH"
            width={280}
            height={92}
            priority
            className="h-16 w-auto"
          />
          <p className="mt-3 text-[#525252]">
            Masuk untuk mulai redeem voucher
          </p>
        </div>

        {step === "email" ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold tracking-widest text-[#525252] uppercase">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                className="focus:border-primary focus:ring-primary mt-2 w-full rounded-[var(--radius-md)] border border-[#ececec] bg-[#fafaf9] px-4 py-3 text-[#171717] transition-colors placeholder:text-[#a3a3a3] focus:bg-white focus:ring-2 focus:outline-none"
              />
            </div>

            {error && <p className="text-sm text-[#b91c1c]">{error}</p>}

            <button
              type="submit"
              disabled={isLoading || !email}
              className="font-display w-full rounded-full bg-gradient-to-r from-[#006c48] to-[#2de19d] py-4 text-lg font-bold text-white disabled:opacity-50"
            >
              {isLoading ? "Mengirim..." : "Kirim Kode OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <p className="text-center text-sm text-[#525252]">
              Kode OTP telah dikirim ke <strong>{email}</strong>
            </p>

            <div>
              <label className="text-[10px] font-bold tracking-widest text-[#525252] uppercase">
                Kode OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                required
                maxLength={6}
                className="focus:border-primary focus:ring-primary mt-2 w-full rounded-[var(--radius-md)] border border-[#ececec] bg-[#fafaf9] px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] text-[#171717] transition-colors placeholder:text-[#a3a3a3] focus:bg-white focus:ring-2 focus:outline-none"
              />
            </div>

            {error && <p className="text-sm text-[#b91c1c]">{error}</p>}

            <button
              type="submit"
              disabled={isLoading || otp.length < 6}
              className="font-display w-full rounded-full bg-gradient-to-r from-[#006c48] to-[#2de19d] py-4 text-lg font-bold text-white disabled:opacity-50"
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
                className="text-sm font-semibold text-[#525252]"
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
