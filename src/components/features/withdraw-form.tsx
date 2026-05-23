"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
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
import { formatWealth } from "@/lib/utils";

export interface WithdrawFormSubmit {
  amountWei: bigint;
  targetAddress: `0x${string}`;
}

interface WithdrawFormProps {
  /** Associates the modal-footer submit button with this form. */
  formId: string;
  rawBalance: bigint | undefined;
  formattedBalance: string;
  isSubmitting: boolean;
  onSubmit: (values: WithdrawFormSubmit) => void;
}

export function WithdrawForm({
  formId,
  rawBalance,
  formattedBalance,
  isSubmitting,
  onSubmit,
}: WithdrawFormProps) {
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
      <form id={formId} onSubmit={handleSubmit} className="space-y-5">
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
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleMax}
                  disabled={isSubmitting || !rawBalance || rawBalance === 0n}
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
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
