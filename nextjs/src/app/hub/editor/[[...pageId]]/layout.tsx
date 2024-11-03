import Navbar from "@/components/navbar";
import { useRequireAuth } from "@/hooks/auth";
import { Toaster } from "sonner";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await useRequireAuth();

  return (
    <div className='h-dvh flex flex-col'>
      <Navbar isLoggedIn={true} />
      <main className="h-full relative overflow-x-hidden overflow-y-hidden flex-grow text-black bg-[var(--puck-color-white)]" id='puck-editor-root'>
        {children}
      </main>
      <Toaster />
    </div>
  );
}