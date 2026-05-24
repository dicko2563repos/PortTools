import { HubHome } from "@porttools/ui";

export default function HomePage() {
  return <HubHome supportEmail={process.env.NEXT_PUBLIC_SUPPORT_EMAIL} />;
}
