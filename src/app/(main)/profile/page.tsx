// Profile is auth-only; opt out of prerendering so Privy is never
// initialized with build-time placeholder env vars.
export const dynamic = "force-dynamic";

import { ProfileInteractive } from "./profile-client";

export default function ProfilePage() {
  return <ProfileInteractive />;
}
