export default async function IntegrationsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <main className="flex justify-center ">
      <div className="flex flex-col items-center max-w-7xl">{children}</div>
    </main>
  )
}
