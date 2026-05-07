export interface WelcomeTriggerInput {
  ready: boolean;
  authenticated: boolean;
  balanceIsSuccess: boolean;
  rawBalance: bigint | undefined;
  redemptionsIsSuccess: boolean;
  redemptionTotal: number | undefined;
  flagSet: boolean;
}

export function shouldShowWelcomeSheet(input: WelcomeTriggerInput): boolean {
  const {
    ready,
    authenticated,
    balanceIsSuccess,
    rawBalance,
    redemptionsIsSuccess,
    redemptionTotal,
    flagSet,
  } = input;
  if (!ready) return false;
  if (!authenticated) return false;
  if (!balanceIsSuccess || !redemptionsIsSuccess) return false;
  if (rawBalance === undefined) return false;
  if (rawBalance > 0n) return false;
  if ((redemptionTotal ?? 0) > 0) return false;
  if (flagSet) return false;
  return true;
}

export function welcomeFlagKey(userId: string): string {
  return `wealth.welcome-shown.${userId}`;
}
