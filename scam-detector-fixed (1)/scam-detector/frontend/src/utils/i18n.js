import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      nav: {
        dashboard: "Dashboard", liveDetection: "Live Detection",
        uploadAnalysis: "Upload Analysis", history: "Call History",
        reports: "Reports", admin: "Admin Panel", settings: "Settings",
        logout: "Logout",
      },
      dashboard: {
        title: "Dashboard", totalScans: "Total Scans",
        scamsDetected: "Scams Detected", genuineCalls: "Genuine Calls",
        scamRate: "Scam Rate", recentActivity: "Recent Activity",
        weeklyTrend: "Weekly Trend",
      },
      detection: {
        live: "Live Detection", upload: "Upload Audio",
        startRecording: "Start Recording", stopRecording: "Stop Recording",
        analyzing: "Analyzing...", result: "Detection Result",
        scam: "SCAM DETECTED", genuine: "GENUINE CALL",
        confidence: "Confidence", riskLevel: "Risk Level",
        explanation: "AI Analysis", downloadReport: "Download Report",
      },
      common: {
        loading: "Loading...", error: "Error", success: "Success",
        delete: "Delete", cancel: "Cancel", save: "Save",
        high: "High", medium: "Medium", low: "Low",
      },
    },
  },
  hi: {
    translation: {
      nav: {
        dashboard: "डैशबोर्ड", liveDetection: "लाइव डिटेक्शन",
        uploadAnalysis: "अपलोड विश्लेषण", history: "कॉल इतिहास",
        reports: "रिपोर्ट्स", admin: "एडमिन", settings: "सेटिंग्स",
        logout: "लॉगआउट",
      },
      detection: {
        live: "लाइव डिटेक्शन", upload: "ऑडियो अपलोड",
        startRecording: "रिकॉर्डिंग शुरू करें", stopRecording: "रिकॉर्डिंग रोकें",
        analyzing: "विश्लेषण हो रहा है...", scam: "स्कैम पता चला", genuine: "असली कॉल",
        confidence: "विश्वास", riskLevel: "जोखिम स्तर",
      },
      common: {
        loading: "लोड हो रहा है...", error: "त्रुटि", success: "सफलता",
        high: "उच्च", medium: "मध्यम", low: "कम",
      },
    },
  },
  mr: {
    translation: {
      nav: {
        dashboard: "डॅशबोर्ड", liveDetection: "लाइव्ह डिटेक्शन",
        uploadAnalysis: "अपलोड विश्लेषण", history: "कॉल इतिहास",
        logout: "लॉगआउट",
      },
      detection: {
        startRecording: "रेकॉर्डिंग सुरू करा", stopRecording: "रेकॉर्डिंग थांबवा",
        scam: "स्कॅम आढळला", genuine: "खरी कॉल",
      },
      common: { loading: "लोड होत आहे...", high: "उच्च", medium: "मध्यम", low: "कमी" },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem("language") || "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
