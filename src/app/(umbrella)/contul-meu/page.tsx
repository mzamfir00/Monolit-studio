import { redirect } from "next/navigation";

export default async function AccountHome({ searchParams }: { searchParams: Promise<{ parola?: string }> }) {
  const { parola } = await searchParams;
  redirect(parola ? "/contul-meu/comenzi?parola=noua" : "/contul-meu/comenzi");
}
