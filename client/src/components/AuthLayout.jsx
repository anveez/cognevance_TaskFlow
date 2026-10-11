export default function AuthLayout({ children }) {
  return (
    <div className="auth">
      <aside className="auth-aside">
        <div className="brand"><span className="brand-mark" />Taskwine</div>
        <div>
          <h2>Plan the week. Finish what matters.</h2>
          <p>Add tasks, set deadlines, and see what's overdue before it becomes a problem.</p>
        </div>
      </aside>
      <main className="auth-main">{children}</main>
    </div>
  );
}