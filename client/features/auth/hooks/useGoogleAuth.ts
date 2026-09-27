"use client";

import { CredentialResponse } from "@react-oauth/google";
import { useGoogleSigninMutation } from "../api";
import { throttle } from "@/utils";
import { AuthUser, setCredentials } from "@/store/slices/authSlice";

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

      const authUser: AuthUser = {
        UserId: result.data.userId,
        FullName: result.data.fullName,
        Email: result.data.email,
        ProfilePhoto: result.data.profilePhotoUrl,
      };

      setCredentials({ user: authUser, token: result.data.token });
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
