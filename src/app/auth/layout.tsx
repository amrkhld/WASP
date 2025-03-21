export const metadata = {
  title: 'WASP | Authentication',
  description: 'Login and signup for the WASP application',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-layout">
      <div className="gradient-container">
        <div className="floating-shape shape1"></div>
        <div className="floating-shape shape2"></div>
        <div className="floating-shape shape3"></div>
      </div>
      <main className="auth-main">
        {children}
      </main>
    </div>
  );
}
