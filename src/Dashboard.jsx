import { useEffect, useState } from "react";
import "./Dashboard.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Dashboard({ user, website, token, onEditWebsite, onLogout }) {
  const businessName = website?.businessName?.trim();

  const [enquiries, setEnquiries] = useState([]);
  const [enquiriesLoading, setEnquiriesLoading] = useState(true);
  const [enquiriesError, setEnquiriesError] = useState("");

  // ==================================================
  // LOAD CUSTOMER ENQUIRIES
  // ==================================================

  useEffect(() => {
    if (!token) {
      setEnquiriesLoading(false);
      setEnquiriesError("Authentication token is missing.");
      return;
    }

    const loadEnquiries = async () => {
      try {
        setEnquiriesLoading(true);
        setEnquiriesError("");

        const response = await fetch(
          `${API_URL}/api/service-requests/my-requests`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Failed to load customer enquiries",
          );
        }

        setEnquiries(Array.isArray(result.enquiries) ? result.enquiries : []);
      } catch (error) {
        console.error("Load enquiries error:", error);

        setEnquiriesError(error.message || "Failed to load customer enquiries");
      } finally {
        setEnquiriesLoading(false);
      }
    };

    loadEnquiries();
  }, [token]);

  // ==================================================
  // FORMAT DATE
  // ==================================================

  const formatDate = (date) => {
    if (!date) {
      return "";
    }

    try {
      return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  // ==================================================
  // STATUS HELPERS
  // ==================================================

  const getStatusClass = (status) => {
    const normalizedStatus = String(status || "new").toLowerCase();

    if (normalizedStatus === "completed") {
      return "enquiry-status completed";
    }

    if (normalizedStatus === "contacted") {
      return "enquiry-status contacted";
    }

    return "enquiry-status new";
  };

  const getStatusLabel = (status) => {
    const normalizedStatus = String(status || "new").toLowerCase();

    if (normalizedStatus === "completed") {
      return "Completed";
    }

    if (normalizedStatus === "contacted") {
      return "Contacted";
    }

    return "New";
  };

  const newEnquiries = enquiries.filter(
    (enquiry) => String(enquiry.status || "new").toLowerCase() === "new",
  ).length;

  // ==================================================
  // DASHBOARD
  // ==================================================

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
            CUSTOMER ENQUIRIES
        ========================= */}

        <section className="enquiries-card">
          <div className="enquiries-header">
            <div>
              <p className="card-label">CUSTOMER ENQUIRIES</p>

              <h2>Enquiries from your website</h2>

              <p className="enquiries-subtitle">
                Manage requests submitted by your customers.
              </p>
            </div>

            <div className="enquiries-count">
              <strong>{enquiries.length}</strong>

              <span>Total</span>
            </div>
          </div>

          {/* =========================
              SUMMARY
          ========================= */}

          {!enquiriesLoading && !enquiriesError && enquiries.length > 0 && (
            <div className="enquiries-summary">
              <span>🔵 {newEnquiries} new</span>

              <span>📋 {enquiries.length} total</span>
            </div>
          )}

          {/* =========================
              LOADING
          ========================= */}

          {enquiriesLoading && (
            <div className="enquiries-empty">
              <div className="enquiry-loading-spinner" />

              <p>Loading customer enquiries...</p>
            </div>
          )}

          {/* =========================
              ERROR
          ========================= */}

          {!enquiriesLoading && enquiriesError && (
            <div className="enquiries-error">
              <span>⚠️</span>

              <div>
                <strong>Unable to load enquiries</strong>

                <p>{enquiriesError}</p>
              </div>
            </div>
          )}

          {/* =========================
              EMPTY
          ========================= */}

          {!enquiriesLoading && !enquiriesError && enquiries.length === 0 && (
            <div className="enquiries-empty">
              <div className="enquiries-empty-icon">📭</div>

              <h3>No customer enquiries yet</h3>

              <p>
                When customers submit the enquiry form on your website, their
                requests will appear here.
              </p>
            </div>
          )}

          {/* =========================
              ENQUIRIES LIST
          ========================= */}

          {!enquiriesLoading && !enquiriesError && enquiries.length > 0 && (
            <div className="enquiries-list">
              {enquiries.map((enquiry) => (
                <div className="enquiry-item" key={enquiry.id}>
                  {/* CUSTOMER HEADER */}

                  <div className="enquiry-main">
                    <div className="enquiry-customer">
                      <div className="enquiry-avatar">
                        {String(enquiry.customerName || "C")
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <h3>{enquiry.customerName || "Customer"}</h3>

                        <a
                          href={`tel:${enquiry.phone}`}
                          className="enquiry-phone"
                        >
                          📞 {enquiry.phone}
                        </a>
                      </div>
                    </div>

                    <span className={getStatusClass(enquiry.status)}>
                      {getStatusLabel(enquiry.status)}
                    </span>
                  </div>

                  {/* ENQUIRY DETAILS */}

                  <div className="enquiry-details">
                    {enquiry.service && (
                      <div className="enquiry-detail">
                        <span>🛠️</span>

                        <div>
                          <small>Service / Requirement</small>

                          <strong>{enquiry.service}</strong>
                        </div>
                      </div>
                    )}

                    {enquiry.vehicle && (
                      <div className="enquiry-detail">
                        <span>🚗</span>

                        <div>
                          <small>Vehicle</small>

                          <strong>{enquiry.vehicle}</strong>
                        </div>
                      </div>
                    )}

                    {enquiry.preferredDate && (
                      <div className="enquiry-detail">
                        <span>📅</span>

                        <div>
                          <small>Preferred Date</small>

                          <strong>{formatDate(enquiry.preferredDate)}</strong>
                        </div>
                      </div>
                    )}

                    {enquiry.message && (
                      <div className="enquiry-message">
                        <small>Message</small>

                        <p>{enquiry.message}</p>
                      </div>
                    )}
                  </div>

                  {/* FOOTER */}

                  <div className="enquiry-footer">
                    <span>Received {formatDate(enquiry.createdAt)}</span>

                    <a
                      href={`tel:${enquiry.phone}`}
                      className="enquiry-contact-button"
                    >
                      📞 Contact Customer
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
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
