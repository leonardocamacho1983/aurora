import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ code: string }>;
};

export default async function ReferralRedirectPage({ params }: Props) {
  const { code } = await params;
  redirect(`/?ref=${encodeURIComponent(code)}`);
}
