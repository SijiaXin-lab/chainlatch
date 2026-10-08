import './App.css'

function App() {
  return (
    <main className="page">
      <header className="site-header">
        <span className="brand">ChainLatch</span>
        <span className="lab-name">SijiaXin-Lab</span>
      </header>

      <section className="hero">
        <p className="eyebrow">WEB3 SECURITY RESEARCH</p>

        <h1>ChainLatch</h1>

        <p className="tagline">
          Verify intent. Enforce approval.
        </p>

        <p className="lead">
          A research project exploring how to allow only approved
          transfers from a protected blockchain wallet.
        </p>

        <a className="project-link" href="#protections">
          Explore the project
        </a>
      </section>

      <section id="protections" className="protections">
        <p className="eyebrow">WHAT WE ARE BUILDING</p>
        <h2>Planned protections</h2>

        <article className="protection">
          <h3>01 / Intent matching</h3>
          <p>
            Compare the transfer request with the approved recipient,
            amount, and network.
          </p>
        </article>

        <article className="protection">
          <h3>02 / Bypass protection</h3>
          <p>
            Require valid approval at the protected wallet, even when
            the verification screen is skipped.
          </p>
        </article>

        <article className="protection">
          <h3>03 / Duplicate payment prevention</h3>
          <p>
            Reject reused approvals and prevent the same payment
            from being executed twice by the protected wallet.
          </p>
        </article>
      </section>

      <aside className="status" aria-labelledby="status-title">
        <h2 id="status-title">Development status</h2>
        <p>
          Early prototype. Wallet connection and transfer protection
          are not active yet.
        </p>
      </aside>

      <footer className="site-footer">
        ChainLatch by SijiaXin-Lab
      </footer>
    </main>
  )
}

export default App