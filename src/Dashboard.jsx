import "./Dashboard.css";

function Dashboard({ user, website, onEditWebsite, onLogout }) {
  const businessName = website?.businessName?.trim();

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        {/* =========================
            HEADER
           ========================= */}

        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">WEBSITE BUILDER</p>

            <h1>Welcome, {user?.name || "Customer"} 👋</h1>

            <p className="dashboard-subtitle">
              Manage and customize your business website.
            </p>
          </div>

          <button className="dashboard-logout" onClick={onLogout}>
            Logout
          </button>
        </header>

        {/* =========================
            WEBSITE OVERVIEW
           ========================= */}

        <section className="website-card">
          <div className="website-card-header">
            <div className="website-icon">🏪</div>

            <div className="website-title-area">
              <p className="card-label">YOUR WEBSITE</p>

              <h2>{businessName || "Your Business Website"}</h2>
            </div>

            <span className="website-status">● Ready</span>
          </div>

          <div className="website-divider" />

          <div className="website-info-grid">
            <div className="website-info-item">
              <span>Theme</span>
              <strong>{website?.theme || "Blue"}</strong>
            </div>

            <div className="website-info-item">
              <span>Services</span>
              <strong>
                {Array.isArray(website?.services) ? website.services.length : 0}
              </strong>
            </div>

            <div className="website-info-item">
              <span>Website ID</span>
              <strong>{website?.id || "-"}</strong>
            </div>
          </div>

          <button className="dashboard-edit-button" onClick={onEditWebsite}>
            <span>✏️</span>
            <span>Edit Website</span>
            <span className="edit-arrow">→</span>
          </button>
        </section>

        {/* =========================
            GET STARTED
           ========================= */}

        <section className="getting-started-card">
          <div className="getting-started-icon">🚀</div>

          <div className="getting-started-content">
            <h3>Ready to build your website?</h3>

            <p>
              Add your business details, services, contact information, logo and
              choose a design that suits your business.
            </p>
          </div>
        </section>

        {/* =========================
            FOOTER
           ========================= */}

        <footer className="dashboard-footer">
          <span>Website Builder</span>
          <span>•</span>
          <span>Dashboard</span>
        </footer>
      </div>
    </div>
  );
}

export default Dashboard;
