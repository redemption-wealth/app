export function describeSendCodeError(err: unknown): string {
  const message = extractMessage(err).toLowerCase();
  if (message.includes("invalid") && message.includes("email")) {
    return "Format email tidak valid.";
  }
  if (message.includes("rate") || message.includes("too many")) {
    return "Terlalu banyak percobaan. Coba lagi dalam beberapa menit.";
  }
  if (message.includes("network") || message.includes("fetch")) {
    return "Koneksi bermasalah. Periksa jaringan Anda dan coba lagi.";
  }
  return "Gagal mengirim kode. Coba lagi.";
}

export function describeLoginCodeError(err: unknown): string {
  const message = extractMessage(err).toLowerCase();
  if (message.includes("expired")) {
    return "Kode OTP kedaluwarsa. Minta kode baru.";
  }
  if (
    message.includes("invalid") ||
    message.includes("incorrect") ||
    message.includes("wrong")
  ) {
    return "Kode OTP salah. Periksa email Anda dan coba lagi.";
  }
  if (message.includes("rate") || message.includes("too many")) {
    return "Terlalu banyak percobaan. Coba lagi dalam beberapa menit.";
  }
  if (message.includes("network") || message.includes("fetch")) {
    return "Koneksi bermasalah. Periksa jaringan Anda dan coba lagi.";
  }
  return "Verifikasi gagal. Coba lagi.";
}

function extractMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string") return msg;
  }
  return "";
}
