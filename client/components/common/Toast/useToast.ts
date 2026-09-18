"use client";

import { useContext } from "react";
import {
  ToastContext,
  ToastContextType,
} from "@/components/common/Toast/ToastProvider";

const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be inside ToastProvider");
  }

  return context;
};

export default useToast;
