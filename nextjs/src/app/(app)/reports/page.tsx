import { useRequireAuth } from "@/hooks/auth";
import { Metadata } from "next";
import ReportList from "./ReportList";

export default async function Page() {
  await useRequireAuth();

  return (
    <div className="max-w-7xl space-y-7 w-full">
      <PageHeader />
      <div className="border-b border-meepGray-700 pt-10" />
      <h2 className="text-hSm label">Your reports</h2>
      <ReportList />
    </div>
  )
}

function PageHeader() {
  return (
    <header className="grid grid-rows-2 md:grid-rows-1 md:grid-cols-2 gap-8">
      <div>
        <h1 className="text-hLg mb-7">Reports</h1>
        <p className="text-meepGray-400 w-[400px]">
          Make sense of your data with reports. Create, edit, and share them with your team, your members and the public.
        </p>
      </div>
      <img src="/reports_page_screenshot.png" alt="Description of the image" />
    </header>
  );
}

export const metadata: Metadata = {
  title: "Your reports",
};