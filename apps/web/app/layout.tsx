import "../styles/globals.css";

export const metadata = {
  title: "Agenda de Blocos de Carnaval",
  description: "Planeje sua agenda de blocos de carnaval."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-950 text-slate-50">
        {children}
      </body>
    </html>
  );
}
