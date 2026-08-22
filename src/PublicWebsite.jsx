import { useEffect, useState } from "react";
import "./App.css";
import WebsiteRenderer from "./WebsiteRenderer";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function PublicWebsite({ websiteId }) {
  const [website, setWebsite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("home");

  const [booking, setBooking] = useState({
    name: "",
    phone: "",
    vehicle: "",
    service: "",
    notes: "",
  });

  const [bookingStatus, setBookingStatus] = useState("");

  // ==================================================
  // LOAD PUBLIC WEBSITE
  // ==================================================

  useEffect(() => {
    const loadWebsite = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `${API_URL}/api/websites/public/${websiteId}`,
        );

        if (!response.ok) {
          throw new Error("Failed to load website");
        }

        const data = await response.json();

        console.log("Public website loaded:", data);

        setWebsite(data);
      } catch (error) {
        console.error("Public website error:", error);
        setWebsite(null);
      } finally {
        setLoading(false);
      }
    };

    if (websiteId) {
      loadWebsite();
    }
  }, [websiteId]);

  // ==================================================
  // ACTIVE NAVIGATION
  // ==================================================

  useEffect(() => {
    const sectionIds = [
      "home",
      "services",
      "gallery",
      "book",
      "about",
      "contact",
    ];

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140;

      let currentSection = "home";

      sectionIds.forEach((id) => {
        const section = document.getElementById(id);

        if (section && section.offsetTop <= scrollPosition) {
          currentSection = id;
        }
      });

      setActiveSection(currentSection);
    };

    window.addEventListener("scroll", handleScroll);

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [website]);

  // ==================================================
  // SCROLL TO SECTION
  // ==================================================

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // ==================================================
  // HELPERS
  // ==================================================

  const cleanPhone = (value = "") => {
    return value.replace(/[^\d+]/g, "");
  };

  const cleanWhatsApp = (value = "") => {
    let number = value.replace(/\D/g, "");

    if (!number) {
      return "";
    }

    // Automatically add India country code
    // for normal 10-digit Indian numbers.
    if (number.length === 10) {
      number = `91${number}`;
    }

    return number;
  };

  const getLogoUrl = (logo) => {
    if (!logo) {
      return null;
    }

    if (logo.startsWith("http://") || logo.startsWith("https://")) {
      return logo;
    }

    return `${API_URL}${logo}`;
  };

  // ==================================================
  // GALLERY NORMALIZATION
  // ==================================================

  const normalizeGallery = (galleryData) => {
    if (!Array.isArray(galleryData)) {
      return [];
    }

    return galleryData
      .map((image, index) => {
        if (!image) {
          return null;
        }

        const imageUrl =
          image.url ||
          image.image_url ||
          image.imageUrl ||
          image.public_url ||
          image.publicUrl;

        if (!imageUrl) {
          return null;
        }

        let finalUrl = imageUrl;

        // If backend returns a relative URL,
        // add the API URL.
        if (
          !imageUrl.startsWith("http://") &&
          !imageUrl.startsWith("https://") &&
          !imageUrl.startsWith("blob:")
        ) {
          finalUrl = `${API_URL}${imageUrl}`;
        }

        return {
          id: image.id || image.gallery_id || `public-gallery-${index}`,

          url: finalUrl,

          name:
            image.name ||
            image.file_name ||
            image.fileName ||
            `Gallery image ${index + 1}`,
        };
      })
      .filter(Boolean);
  };

  // ==================================================
  // INQUIRY FORM
  // ==================================================

  const handleBookingChange = (event) => {
    const { name, value } = event.target;

    setBooking((previous) => ({
      ...previous,
      [name]: value,
    }));

    setBookingStatus("");
  };

  // ==================================================
  // SUBMIT INQUIRY
  // ==================================================

  const handleBookingSubmit = async (event) => {
    event.preventDefault();

    // --------------------------------------------------
    // VALIDATION
    // --------------------------------------------------

    if (!websiteId) {
      setBookingStatus(
        "Unable to submit your request. Website information is missing.",
      );
      return;
    }

    if (!booking.name.trim()) {
      setBookingStatus("Please enter your name.");
      return;
    }

    if (!booking.phone.trim()) {
      setBookingStatus("Please enter your phone number.");
      return;
    }

    if (!booking.service.trim()) {
      setBookingStatus("Please tell us what you need help with.");
      return;
    }

    // --------------------------------------------------
    // SAVE REQUEST
    // --------------------------------------------------

    try {
      setBookingStatus("Submitting your request...");

      const requestData = {
        websiteId,

        customerName: booking.name.trim(),

        phone: booking.phone.trim(),

        // Backend compatibility
        vehicle: null,

        service: booking.service.trim(),

        // Preferred date removed
        preferredDate: null,

        // Optional message
        message: booking.notes.trim() || null,
      };

      console.log("Submitting service request:", requestData);

      const response = await fetch(`${API_URL}/api/service-requests`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to submit service request");
      }

      console.log("Service request created:", result);

      // --------------------------------------------------
      // OPEN WHATSAPP
      // --------------------------------------------------

      const whatsappNumber = cleanWhatsApp(website.whatsapp);

      if (whatsappNumber) {
        const message = [
          `Hello ${businessName},`,
          "",
          "I would like to make an inquiry.",
          "",
          `Name: ${booking.name}`,
          `Phone: ${booking.phone}`,
          `Service / Requirement: ${booking.service}`,
          `Message: ${booking.notes || "None"}`,
          "",
          "Please get back to me when convenient.",
        ].join("\n");

        const whatsappUrl =
          `https://wa.me/${whatsappNumber}` +
          `?text=${encodeURIComponent(message)}`;

        window.open(whatsappUrl, "_blank", "noopener,noreferrer");

        setBookingStatus(
          "Your inquiry was submitted successfully. WhatsApp is ready to continue the conversation.",
        );
      } else {
        setBookingStatus("Your inquiry was submitted successfully.");
      }

      // --------------------------------------------------
      // CLEAR FORM
      // --------------------------------------------------

      setBooking({
        name: "",
        phone: "",
        vehicle: "",
        service: "",
        notes: "",
      });
    } catch (error) {
      console.error("Inquiry submission error:", error);

      setBookingStatus(
        error.message || "Failed to submit your inquiry. Please try again.",
      );
    }
  };

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <div className="public-loading">
        <div>
          <div className="loading-spinner"></div>

          <p>Loading website...</p>
        </div>
      </div>
    );
  }

  // ==================================================
  // ERROR
  // ==================================================

  if (!website) {
    return (
      <div className="public-error">
        <div className="error-card">
          <div className="error-icon">⚠️</div>

          <h1>Website Not Found</h1>

          <p>
            This business website could not be loaded. Please check the website
            link and try again.
          </p>
        </div>
      </div>
    );
  }

  // ==================================================
  // WEBSITE DATA
  // ==================================================

  const {
    businessName: loadedBusinessName = "My Business",
    phone = "",
    about = "",
    heroTitle = "",
    heroSubtitle = "",
    heroBadge = "",
    logo = null,
    theme = "blue",
    address = "",
    whatsapp = "",
    hours = "",
    services = [],
    gallery: galleryData = [],
  } = website;

  const businessName = loadedBusinessName;

  // ==================================================
  // NORMALIZE DATA
  // ==================================================

  const logoUrl = getLogoUrl(logo);

  const phoneNumber = cleanPhone(phone);

  const whatsappNumber = cleanWhatsApp(whatsapp);

  const safeServices = Array.isArray(services) ? services : [];

  const gallery = normalizeGallery(galleryData);

  console.log("Public gallery:", gallery);

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <WebsiteRenderer
      website={website}
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
      services={safeServices}
      gallery={gallery}
      logoUrl={logoUrl}
      phoneNumber={phoneNumber}
      whatsappNumber={whatsappNumber}
      activeSection={activeSection}
      scrollToSection={scrollToSection}
      booking={booking}
      bookingStatus={bookingStatus}
      handleBookingChange={handleBookingChange}
      handleBookingSubmit={handleBookingSubmit}
    />
  );
}

export default PublicWebsite;
