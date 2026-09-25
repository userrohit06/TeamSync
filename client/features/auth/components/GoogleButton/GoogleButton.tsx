"use client";

import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import styles from "./GoogleButton.module.css";

export interface GoogleButtonProps {
  onSuccess: (response: CredentialResponse) => void;
  onError?: () => void;
}

export const GoogleButton = ({ onSuccess, onError }: GoogleButtonProps) => {
  return (
    <>
      <div className={styles.divider}>
        <span>or</span>
      </div>

      <div className={styles.googleButton}>
        <GoogleLogin
          onSuccess={onSuccess}
          onError={onError}
          useOneTap={false}
          theme="outline"
          size="medium"
          width="100%"
          text="continue_with"
        />
      </div>
    </>
  );
};

export default GoogleButton;
