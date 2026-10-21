import React from "react";
import LegalDocumentContent from "./LegalDocumentContent";

export const PRIVACY_POLICY_CONTENT = [
  { t: "h1", x: "Privacy Policy for BirdEarner" },
  { t: "meta", x: "Effective Date: June 1, 2025" },
  {
    t: "p",
    x: 'BCF BirdEarner Solutions (OPC) Pvt Ltd ("we", "us", or "our"), operating under the brand name "BirdEarner", respects your privacy and is committed to protecting it through our compliance with this privacy policy. This policy describes the types of information we may collect from you, how we use it, and how we protect it.',
  },
  { t: "h2", x: "1. Information We Collect" },
  {
    t: "p",
    x: "We collect various types of user information to provide and improve our services through our platform (mobile application and website - www.birdearner.com):",
  },
  {
    t: "ul",
    items: [
      { b: "Personal Information: ", x: "Name, email, phone number, full address" },
      { b: "Device Information: ", x: "IP address, location, device type" },
      { b: "Payment Information: ", x: "Bank account details for processing payments" },
      {
        b: "Professional Information: ",
        x: "Skills, previous projects, portfolio, highlighted work",
      },
      { b: "Login Credentials: ", x: "Third-party login data (Google login)" },
    ],
  },
  { t: "h2", x: "2. How We Use Your Information" },
  {
    t: "p",
    x: "Your data is collected and used strictly for:",
  },
  {
    t: "ul",
    items: [
      "Matching clients with suitable freelancers",
      "Scheduling services with location, budget, and media attachments (onsite and remote)",
      "Enabling file sharing between clients and freelancers for project delivery and revision",
      "Identity verification and communication",
    ],
  },
  {
    t: "p",
    x: "We do not use your information for unsolicited marketing, nor do we share your data with third parties.",
  },
  { t: "h2", x: "3. Data Security" },
  {
    t: "p",
    x: "We implement appropriate technical and organizational security measures, including:",
  },
  {
    t: "ul",
    items: ["End-to-end encryption", "Secure servers and firewalls"],
  },
  {
    t: "p",
    x: "These measures ensure that your data is protected from unauthorized access or disclosure.",
  },
  { t: "h2", x: "4. User Rights" },
  {
    t: "p",
    x: "You have full control over your data:",
  },
  {
    t: "ul",
    items: [
      "Users may update their profile, portfolio, and personal information anytime",
      "Users may request to delete their account/data. Data deletion requests are processed within 4–7 business days",
    ],
  },
  { t: "h2", x: "5. Use of Third-Party Services" },
  {
    t: "p",
    x: "To enhance user experience and operational efficiency, we utilize:",
  },
  {
    t: "ul",
    items: [
      "Razorpay (for secure payments)",
      "Google Maps API (for onsite service coordination)",
      "Firebase (for notifications and app infrastructure)",
    ],
  },
  { t: "h2", x: "6. Children's Policy" },
  {
    t: "p",
    x: "Our services are available for users aged 15 years and above. We do not knowingly collect personal data from children under the age of 15.",
  },
  { t: "h2", x: "7. Contact Information" },
  {
    t: "p",
    x: "If you have any questions or concerns regarding this Privacy Policy or your personal data, you may contact us at:",
  },
  {
    t: "ul",
    items: [{ b: "Email: ", x: "support@birdearner.com" }],
  },
  { t: "h2", x: "8. Changes to This Policy" },
  {
    t: "p",
    x: "We reserve the right to modify this Privacy Policy at any time. Changes will be updated on this page with the new effective date.",
  },
  { t: "footer", x: "Thank you for trusting BirdEarner." },
];

const PrivacyPolicyContent = () => (
  <LegalDocumentContent blocks={PRIVACY_POLICY_CONTENT} />
);

export default PrivacyPolicyContent;
