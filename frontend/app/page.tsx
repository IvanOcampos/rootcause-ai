const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function Home() {
  return (
    <main className="antialiased">
      <p className="eyebrow">ROOTCAUSE AI / PHASE 01</p>
      <h1>Incident investigation, ready to start.</h1>
      <p className="intro">
        The command center, evidence tools, and recovery workflow will be added in the next phases.
      </p>
      <section>
        <span className="status-dot" />
        <div><strong>Platform bootstrap complete</strong><br /><small>Frontend is configured for {apiUrl}</small></div>
      </section>
    </main>
  );
}
