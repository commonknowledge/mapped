import { AreaPattern } from "@/components/areaPattern";
import Navbar from "@/components/navbar";
import { useAuth } from "@/hooks/auth";
import { Toaster } from "sonner";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await useAuth();
  const isLoggedIn = Boolean(user);

  return (
    <div className='h-dvh flex flex-col'>
      <Navbar isLoggedIn={isLoggedIn} />
      <AreaPattern />
      <main className="p-4 sm:p-8 md:p-20 relative 2xl:p-24 overflow-x-hidden overflow-y-auto flex-grow">
          {children}
      </main>
      <Toaster />
    </div>
  );
}