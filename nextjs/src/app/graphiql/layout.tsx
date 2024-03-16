import { Metadata } from "next";

export default function ({ children }: { children: React.ReactNode }) {
  return <div className='h-[100dvh]'>{children}</div>
}

export const metadata: Metadata = {
  title: "GraphiQL",
};