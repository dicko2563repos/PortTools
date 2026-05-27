export function AdminConsoleHeader({
  email,
  logout,
}: {
  email: string;
  logout: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex items-center justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold">Admin console</h1>
        <p className="text-sm text-slate-600">{email}</p>
      </div>
      {logout}
    </header>
  );
}
