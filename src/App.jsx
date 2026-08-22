import { useState, useEffect, useRef } from "react";
import "./App.css";
import Login from "./Login";
import Dashboard from "./Dashboard";
import PublicWebsite from "./PublicWebsite";
import AdminDashboard from "./AdminDashboard";
import WebsiteRenderer from "./WebsiteRenderer";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [showDashboard, setShowDashboard] = useState(true);

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [website, setWebsite] = useState(null);

  // ==================================================
  // WEBSITE DATA
  // ==================================================

  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [about, setAbout] = useState("");
  const [logo, setLogo] = useState(null);
  const [theme, setTheme] = useState("blue");
  const [address, setAddress] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [hours, setHours] = useState("");
  const [services, setServices] = useState([]);

  // ==================================================
  // MOBILE EDITOR
  // ==================================================

  const [openSection, setOpenSection] = useState("business");
  const [mobileView, setMobileView] = useState("edit");
  const [saveStatus, setSaveStatus] = useState("saved");

  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroBadge, setHeroBadge] = useState("");

  // ==================================================
  // PREVIEW REF
  // ==================================================

  const previewRef = useRef(null);

  // ==================================================
  // PREVIEW NAVIGATION
  // ==================================================

  const scrollToSection = (sectionId) => {
    const preview = previewRef.current;

    if (!preview) {
      return;
    }

    const section = preview.querySelector(`#${sectionId}`);

    if (!section) {
      console.warn(`Preview section not found: ${sectionId}`);
      return;
    }

    const previewTop = preview.getBoundingClientRect().top;
    const sectionTop = section.getBoundingClientRect().top;

    const scrollPosition = preview.scrollTop + (sectionTop - previewTop);

    preview.scrollTo({
      top: scrollPosition,
      behavior: "smooth",
    });
  };

  // ==================================================
  // LOAD WEBSITE
  // ==================================================

  useEffect(() => {
    if (!token) {
      return;
    }

    const loadWebsite = async () => {
      try {
        const response = await fetch(`${API_URL}/api/websites/my-website`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load website");
        }

        const data = await response.json();

        console.log("Website loaded:", data);

        setWebsite(data);

        setBusinessName(data.businessName || "");
        setPhone(data.phone || "");
        setAbout(data.about || "");

        setHeroTitle(data.heroTitle || "");
        setHeroSubtitle(data.heroSubtitle || "");
        setHeroBadge(data.heroBadge || "");

        // ==================================================
        // LOGO
        // ==================================================

        if (data.logo) {
          if (data.logo.startsWith("http")) {
            setLogo(data.logo);
          } else {
            setLogo(`${API_URL}${data.logo}`);
          }
        } else {
          setLogo(null);
        }

        // ==================================================
        // OTHER WEBSITE DATA
        // ==================================================

        setTheme(data.theme || "blue");
        setAddress(data.address || "");
        setWhatsapp(data.whatsapp || "");
        setHours(data.hours || "");

        setServices(Array.isArray(data.services) ? data.services : []);

        setSaveStatus("saved");
      } catch (error) {
        console.error("Error loading website:", error);
      }
    };

    loadWebsite();
  }, [token]);

  // ==================================================
  // TOGGLE SECTION
  // ==================================================

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  // ==================================================
  // MARK FIELD AS UNSAVED
  // ==================================================

  const markUnsaved = (setter) => (event) => {
    setter(event.target.value);
    setSaveStatus("unsaved");
  };

  // ==================================================
  // SAVE WEBSITE
  // ==================================================

  const handleSaveWebsite = async () => {
    if (!token) {
      console.error("No authentication token available.");

      setSaveStatus("error");
      return;
    }

    const websiteData = {
      businessName,
      phone,
      about,
      heroTitle,
      heroSubtitle,
      heroBadge,
      logo,
      theme,
      address,
      whatsapp,
      hours,
      services,
    };

    try {
      setSaveStatus("saving");

      const response = await fetch(`${API_URL}/api/websites/my-website`, {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify(websiteData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to save website");
      }

      console.log("Website saved:", result);

      setWebsite({
        ...website,
        ...websiteData,
      });

      setSaveStatus("saved");
    } catch (error) {
      console.error("Save error:", error);
      setSaveStatus("error");
    }
  };

  // ==================================================
  // LOGO UPLOAD
  // ==================================================

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!token) {
      alert("You are not logged in.");
      return;
    }

    // ==================================================
    // BASIC CLIENT-SIDE VALIDATION
    // ==================================================

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (!allowedTypes.includes(file.type)) {
      alert("Please select a JPG, PNG, WEBP or GIF image.");

      event.target.value = "";
      return;
    }

    // ==================================================
    // 5 MB LIMIT
    // ==================================================

    if (file.size > 5 * 1024 * 1024) {
      alert("Logo image must be smaller than 5 MB.");

      event.target.value = "";
      return;
    }

    try {
      setSaveStatus("saving");

      const formData = new FormData();

      formData.append("logo", file);

      const response = await fetch(`${API_URL}/api/websites/upload-logo`, {
        method: "POST",

        headers: {
          Authorization: `Bearer ${token}`,
        },

        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Logo upload failed");
      }

      console.log("Logo uploaded:", result);

      const logoUrl = result.logo.startsWith("http")
        ? result.logo
        : `${API_URL}${result.logo}`;

      setLogo(logoUrl);

      // ==================================================
      // UPDATE LOCAL WEBSITE STATE
      // ==================================================

      setWebsite((previous) => ({
        ...(previous || {}),
        logo: result.logo,
      }));

      setSaveStatus("saved");
    } catch (error) {
      console.error("Logo upload error:", error);

      setSaveStatus("error");

      alert(error.message || "Logo upload failed");
    }

    // ==================================================
    // ALLOW SELECTING SAME FILE AGAIN
    // ==================================================

    event.target.value = "";
  };

  // ==================================================
  // REFRESH WEBSITE BEFORE DASHBOARD
  // ==================================================

  const handleBackToDashboard = async () => {
    try {
      const response = await fetch(`${API_URL}/api/websites/my-website`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to refresh website");
      }

      const data = await response.json();

      setWebsite(data);

      setBusinessName(data.businessName || "");
      setPhone(data.phone || "");
      setAbout(data.about || "");

      setHeroTitle(data.heroTitle || "");
      setHeroSubtitle(data.heroSubtitle || "");
      setHeroBadge(data.heroBadge || "");

      // ==================================================
      // LOGO
      // ==================================================

      if (data.logo) {
        if (data.logo.startsWith("http")) {
          setLogo(data.logo);
        } else {
          setLogo(`${API_URL}${data.logo}`);
        }
      } else {
        setLogo(null);
      }

      // ==================================================
      // OTHER WEBSITE DATA
      // ==================================================

      setTheme(data.theme || "blue");
      setAddress(data.address || "");
      setWhatsapp(data.whatsapp || "");
      setHours(data.hours || "");

      setServices(Array.isArray(data.services) ? data.services : []);

      setSaveStatus("saved");

      setShowDashboard(true);
    } catch (error) {
      console.error("Error returning to dashboard:", error);

      alert("Failed to load latest website data.");
    }
  };

  // ==================================================
  // ROUTING
  // ==================================================

  const path = window.location.pathname;

  // ==================================================
  // PUBLIC WEBSITE
  // ==================================================

  if (path.startsWith("/site/")) {
    const websiteId = path.split("/")[2];

    return <PublicWebsite websiteId={websiteId} />;
  }

  // ==================================================
  // LOGIN
  // ==================================================

  if (!loggedIn) {
    return (
      <Login
        onLogin={(data) => {
          setLoggedIn(true);
          setUser(data.user);
          setToken(data.token);

          console.log("Logged in user:", data.user);
        }}
      />
    );
  }

  // ==================================================
  // ADMIN DASHBOARD
  // ==================================================

  if (path === "/admin") {
    if (user?.role !== "admin") {
      return (
        <div className="public-empty">
          <h1>Access Denied</h1>

          <p>You do not have permission to access the Admin Dashboard.</p>
        </div>
      );
    }

    return <AdminDashboard token={token} />;
  }

  // ==================================================
  // CUSTOMER DASHBOARD
  // ==================================================

  if (showDashboard) {
    return (
      <Dashboard
        user={user}
        website={website}
        onEditWebsite={() => {
          setMobileView("edit");
          setSaveStatus("saved");
          setShowDashboard(false);
        }}
        onLogout={() => {
          setLoggedIn(false);
          setUser(null);
          setToken(null);
          setWebsite(null);
        }}
      />
    );
  }

  // ==================================================
  // WEBSITE EDITOR
  // ==================================================

  return (
    <div className="website-customizer">
      {/* ==================================================
          EDITOR PANE
      ================================================== */}

      <div
        className={`editor-pane ${
          mobileView === "preview" ? "mobile-hidden" : ""
        }`}
      >
        <div className="editor">
          {/* ==================================================
              EDITOR HEADER
          ================================================== */}

          <div className="editor-header">
            <button
              className="editor-back-button"
              onClick={handleBackToDashboard}
            >
              ←
            </button>

            <div className="editor-header-title">
              <h1>Website Customizer</h1>

              <span>Edit your website</span>
            </div>

            <div className="editor-save-area">
              <span className={`save-status ${saveStatus}`}>
                {saveStatus === "saved" && "✓ All changes saved"}

                {saveStatus === "unsaved" && "● Unsaved changes"}

                {saveStatus === "saving" && "Saving..."}

                {saveStatus === "error" && "⚠ Save failed"}
              </span>

              <button
                className="editor-save-button"
                onClick={handleSaveWebsite}
                disabled={saveStatus === "saving"}
              >
                {saveStatus === "saving" ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          {/* ==================================================
              BUSINESS SECTION
          ================================================== */}

          <div className="editor-section">
            <button
              className="section-header"
              onClick={() => toggleSection("business")}
            >
              <div>
                <span className="section-icon">🏪</span>

                <span>
                  <strong>Business</strong>

                  <small>Business name & logo</small>
                </span>
              </div>

              <span className="section-arrow">
                {openSection === "business" ? "⌃" : "⌄"}
              </span>
            </button>

            {openSection === "business" && (
              <div className="section-content">
                <label>Business Name</label>

                <input
                  type="text"
                  value={businessName}
                  onChange={markUnsaved(setBusinessName)}
                  placeholder="Your business name"
                />

                <label>Business Logo</label>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleLogoUpload}
                />

                {logo && (
                  <div
                    style={{
                      marginTop: "12px",
                    }}
                  >
                    <img
                      src={logo}
                      alt="Business logo"
                      style={{
                        maxWidth: "160px",
                        maxHeight: "100px",
                        objectFit: "contain",
                        borderRadius: "8px",
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ==================================================
              CONTACT SECTION
          ================================================== */}

          <div className="editor-section">
            <button
              className="section-header"
              onClick={() => toggleSection("contact")}
            >
              <div>
                <span className="section-icon">📞</span>

                <span>
                  <strong>Contact</strong>

                  <small>Phone, WhatsApp & address</small>
                </span>
              </div>

              <span className="section-arrow">
                {openSection === "contact" ? "⌃" : "⌄"}
              </span>
            </button>

            {openSection === "contact" && (
              <div className="section-content">
                <label>Phone Number</label>

                <input
                  type="tel"
                  value={phone}
                  onChange={markUnsaved(setPhone)}
                  placeholder="Phone number"
                />

                <label>WhatsApp Number</label>

                <input
                  type="tel"
                  value={whatsapp}
                  onChange={markUnsaved(setWhatsapp)}
                  placeholder="WhatsApp number"
                />

                <label>Business Address</label>

                <input
                  type="text"
                  value={address}
                  onChange={markUnsaved(setAddress)}
                  placeholder="Business address"
                />

                <label>Opening Hours</label>

                <input
                  type="text"
                  value={hours}
                  onChange={markUnsaved(setHours)}
                  placeholder="Opening hours"
                />
              </div>
            )}
          </div>

          {/* ==================================================
              ABOUT SECTION
          ================================================== */}

          <div className="editor-section">
            <button
              className="section-header"
              onClick={() => toggleSection("about")}
            >
              <div>
                <span className="section-icon">📝</span>

                <span>
                  <strong>About</strong>

                  <small>Tell customers about your business</small>
                </span>
              </div>

              <span className="section-arrow">
                {openSection === "about" ? "⌃" : "⌄"}
              </span>
            </button>

            {openSection === "about" && (
              <div className="section-content">
                <label>About Your Business</label>

                <textarea
                  value={about}
                  onChange={markUnsaved(setAbout)}
                  rows="6"
                  placeholder="Tell customers about your business..."
                />
              </div>
            )}
          </div>

          {/* ==================================================
              SERVICES SECTION
          ================================================== */}

          <div className="editor-section">
            <button
              className="section-header"
              onClick={() => toggleSection("services")}
            >
              <div>
                <span className="section-icon">🛠️</span>

                <span>
                  <strong>Services</strong>

                  <small>Manage your services</small>
                </span>
              </div>

              <span className="section-arrow">
                {openSection === "services" ? "⌃" : "⌄"}
              </span>
            </button>

            {openSection === "services" && (
              <div className="section-content">
                {services.length === 0 && (
                  <p
                    style={{
                      color: "#666",
                      marginBottom: "12px",
                    }}
                  >
                    No services added yet.
                  </p>
                )}

                {services.map((service, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginBottom: "10px",
                    }}
                  >
                    <input
                      type="text"
                      value={service}
                      onChange={(event) => {
                        const updatedServices = [...services];

                        updatedServices[index] = event.target.value;

                        setServices(updatedServices);

                        setSaveStatus("unsaved");
                      }}
                      placeholder={`Service ${index + 1}`}
                      style={{
                        flex: 1,
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => {
                        const updatedServices = services.filter(
                          (_, serviceIndex) => serviceIndex !== index,
                        );

                        setServices(updatedServices);

                        setSaveStatus("unsaved");
                      }}
                      style={{
                        padding: "8px 12px",
                        border: "none",
                        borderRadius: "6px",
                        background: "#dc2626",
                        color: "white",
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setServices([...services, ""]);

                    setSaveStatus("unsaved");
                  }}
                  style={{
                    marginTop: "5px",
                    padding: "10px 16px",
                    border: "none",
                    borderRadius: "8px",
                    background: "#2563eb",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  + Add Service
                </button>
              </div>
            )}
          </div>

          {/* ==================================================
              APPEARANCE SECTION
          ================================================== */}

          <div className="editor-section">
            <button
              className="section-header"
              onClick={() => toggleSection("appearance")}
            >
              <div>
                <span className="section-icon">🎨</span>

                <span>
                  <strong>Appearance</strong>

                  <small>Choose your website theme</small>
                </span>
              </div>

              <span className="section-arrow">
                {openSection === "appearance" ? "⌃" : "⌄"}
              </span>
            </button>

            {openSection === "appearance" && (
              <div className="section-content">
                <label>Website Theme</label>

                <select value={theme} onChange={markUnsaved(setTheme)}>
                  <option value="blue">🔵 Blue</option>

                  <option value="dark">⚫ Dark</option>

                  <option value="green">🟢 Green</option>

                  <option value="orange">🟠 Orange</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================
          PREVIEW PANE
      ================================================== */}

      <div
        className={`preview-pane ${
          mobileView === "edit" ? "mobile-hidden" : ""
        }`}
      >
        <div className="preview" ref={previewRef}>
          <WebsiteRenderer
            website={{
              businessName,
              phone,
              about,
              heroTitle,
              heroSubtitle,
              heroBadge,
              logo,
              theme,
              address,
              whatsapp,
              hours,
              services,
            }}
            businessName={businessName}
            phone={phone}
            about={about}
            heroTitle={heroTitle}
            heroSubTitle={heroSubtitle}
            heroBadge={heroBadge}
            logo={logo}
            theme={theme}
            address={address}
            whatsapp={whatsapp}
            hours={hours}
            services={services}
            logoUrl={logo}
            phoneNumber={phone.replace(/[^\d+]/g, "")}
            whatsappNumber={whatsapp.replace(/\D/g, "")}
            activeSection="home"
            scrollToSection={scrollToSection}
            booking={{
              name: "",
              phone: "",
              vehicle: "",
              service: "",
              date: "",
              notes: "",
            }}
            bookingStatus=""
            handleBookingChange={() => {}}
            handleBookingSubmit={(event) => event.preventDefault()}
          />
        </div>
      </div>

      {/* ==================================================
          MOBILE BOTTOM NAVIGATION
      ================================================== */}

      <div className="mobile-editor-nav">
        <button
          className={mobileView === "edit" ? "active" : ""}
          onClick={() => setMobileView("edit")}
        >
          <span>✏️</span>
          <small>Edit</small>
        </button>

        <button
          className={mobileView === "preview" ? "active" : ""}
          onClick={() => setMobileView("preview")}
        >
          <span>👁️</span>
          <small>Preview</small>
        </button>

        <button
          className="save-nav-button"
          onClick={handleSaveWebsite}
          disabled={saveStatus === "saving"}
        >
          <span>💾</span>

          <small>{saveStatus === "saving" ? "Saving" : "Save"}</small>
        </button>
      </div>
    </div>
  );
}

export default App;
