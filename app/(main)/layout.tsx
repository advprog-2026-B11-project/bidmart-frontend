import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { WebSocketProvider } from "@/components/providers/WebSocketProvider";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <WebSocketProvider>
      <Header />
      <main>{children}</main>
      <Footer />
    </WebSocketProvider>
  );
}
