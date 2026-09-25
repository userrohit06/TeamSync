"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

export const useMounted = (): boolean => {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
};

export default useMounted;
