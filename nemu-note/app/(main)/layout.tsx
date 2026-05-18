import { Navbar } from "@/components/navbar";
import { SideBar } from "@/components/sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col h-screen">
      <Navbar />
      <main className="container mx-auto max-w-7xl pt-16 px-6 flex flex-grow">
        <SideBar />
        {children}
      </main>
    </div>
  );
}
