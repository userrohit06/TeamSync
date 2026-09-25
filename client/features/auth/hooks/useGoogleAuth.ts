"use client";

import { CredentialResponse } from "@react-oauth/google";
import { useGoogleSigninMutation } from "../api";
import { throttle } from "@/utils";

export const useGoogleAuth = () => {
  const [googleSignin, { isLoading }] = useGoogleSigninMutation();

  const handleGoogleSuccess = throttle(async (response: CredentialResponse) => {
    if (!response.credential) {
      console.error("Google ID token was not received.");
      return;
    }

    try {
      const result = await googleSignin({
        idToken: response.credential,
      }).unwrap();
      console.log("Google authentication successful:", result);
    } catch (error) {
      console.error("Google authentication failed:", error);
    }
  }, 1500);

  const handleGoogleError = () => {
    console.error("Google authentication failed.");
  };

  return {
    handleGoogleSuccess,
    handleGoogleError,
    isLoading,
  };
};

export default useGoogleAuth;
