import { z } from "zod";

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const DECIMAL_REGEX = /^\d+(\.\d{0,6})?$/;

export interface WithdrawSchemaContext {
  rawBalance: bigint | undefined;
}

function parseAmount(value: string): bigint | null {
  if (!DECIMAL_REGEX.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  const padded = (fraction + "0".repeat(18)).slice(0, 18);
  try {
    return BigInt(whole + padded);
  } catch {
    return null;
  }
}

export function makeWithdrawSchema({ rawBalance }: WithdrawSchemaContext) {
  return z
    .object({
      amount: z
        .string()
        .min(1, "Masukkan jumlah penarikan")
        .regex(DECIMAL_REGEX, "Maksimum 6 angka di belakang koma"),
      targetAddress: z
        .string()
        .min(1, "Masukkan alamat tujuan")
        .regex(ADDRESS_REGEX, "Alamat Ethereum tidak valid"),
    })
    .superRefine((value, ctx) => {
      const parsed = parseAmount(value.amount);
      if (parsed === null) {
        ctx.addIssue({
          code: "custom",
          path: ["amount"],
          message: "Jumlah tidak valid",
        });
        return;
      }
      if (parsed <= 0n) {
        ctx.addIssue({
          code: "custom",
          path: ["amount"],
          message: "Jumlah harus lebih dari 0",
        });
        return;
      }
      if (rawBalance !== undefined && parsed > rawBalance) {
        ctx.addIssue({
          code: "custom",
          path: ["amount"],
          message: "Melebihi saldo yang tersedia",
        });
      }
    });
}

export type WithdrawFormValues = z.infer<ReturnType<typeof makeWithdrawSchema>>;

export function parseWithdrawAmount(value: string): bigint | null {
  return parseAmount(value);
}

export interface GasBudgetInput {
  nativeBalance: bigint;
  estimatedGas: bigint;
  gasPrice: bigint;
}

export function hasGasBudget({
  nativeBalance,
  estimatedGas,
  gasPrice,
}: GasBudgetInput): boolean {
  if (estimatedGas === 0n) return true;
  return nativeBalance >= estimatedGas * gasPrice;
}
