import { Hero } from "@/components/landing/Hero";

// Home pública (landing / lista de espera). Sem auth.
export default function Home() {
  return (
    <div style={{ background: "#0A0814", color: "#F0ECF7" }}>
      <Hero />
    </div>
  );
}
