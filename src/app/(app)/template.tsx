/** Transition douce à chaque changement de page dans l'application (le template est remonté à chaque navigation). */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-rise">{children}</div>;
}
