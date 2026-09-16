"use client";

import Script from "next/script";

declare global {
  interface Window {
    google?: any;
  }
}

const GoogleLoginButton = () => {
  const handleCredentialResponse = async (response: any) => {
    console.log("Google sign in successful");

    const googleIdToken = response;

    console.log("Raw ID token for backend:", googleIdToken);

    // Send token to backend here
  };

  const initializeGoogleSignIn = () => {
    const google = window.google;

    if (!google) {
      console.log("Google script not loaded");
      return;
    }

    google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_CLIENT_ID!,
      callback: handleCredentialResponse,
      ux_mode: "popup",
    });

    google.accounts.id.renderButton(
      document.getElementById("googleButtonContainer"),
      {
        theme: "outline",
        size: "large",
        text: "signin_with",
      },
    );
  };

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        onLoad={initializeGoogleSignIn}
        strategy="afterInteractive"
        async
        defer
      />

      <div id="googleButtonContainer"></div>
    </>
  );
};

export default GoogleLoginButton;
