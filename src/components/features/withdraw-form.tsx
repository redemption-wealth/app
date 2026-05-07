"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useChainId } from "wagmi";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  makeWithdrawSchema,
  parseWithdrawAmount,
  type WithdrawFormValues,
} from "@/lib/schemas/withdraw";
import { TARGET_CHAIN_ID, targetChain } from "@/lib/wagmi";
import { formatWealth } from "@/lib/utils";

export interface WithdrawFormSubmit {
  amountWei: bigint;
  targetAddress: `0x${string}`;
}

interface WithdrawFormProps {
  rawBalance: bigint | undefined;
  formattedBalance: string;
  isSubmitting: boolean;
  onSubmit: (values: WithdrawFormSubmit) => void;
}

export function WithdrawForm({
  rawBalance,
  formattedBalance,
  isSubmitting,
  onSubmit,
}: WithdrawFormProps) {
  const chainId = useChainId();
  const onWrongChain = chainId !== TARGET_CHAIN_ID;

  const schema = useMemo(
    () => makeWithdrawSchema({ rawBalance }),
    [rawBalance],
  );

  const form = useForm<WithdrawFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: "", targetAddress: "" },
    mode: "onBlur",
  });

  const handleMax = () => {
    if (!rawBalance) return;
    form.setValue("amount", formattedBalance.replace(/[^0-9.]/g, ""), {
      shouldValidate: true,
    });
  };

  const handleSubmit = form.handleSubmit((values) => {
    const amountWei = parseWithdrawAmount(values.amount);
    if (amountWei === null) return;
    onSubmit({
      amountWei,
      targetAddress: values.targetAddress as `0x${string}`,
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jumlah</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    inputMode="decimal"
                    placeholder="0.00"
                    autoComplete="off"
                    {...field}
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleMax}
                  disabled={!rawBalance || rawBalance === 0n}
                >
                  Max
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                Saldo tersedia: {formatWealth(formattedBalance)} $WEALTH
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="targetAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alamat tujuan</FormLabel>
              <FormControl>
                <Input
                  placeholder="0x..."
                  autoComplete="off"
                  spellCheck={false}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full rounded-full"
          disabled={onWrongChain || isSubmitting}
        >
          {onWrongChain
            ? `Pindah ke ${targetChain.name}`
            : isSubmitting
              ? "Memproses…"
              : "Lanjutkan"}
        </Button>
      </form>
    </Form>
  );
}
