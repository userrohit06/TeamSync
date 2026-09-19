export const throttle = <T extends (...args: any[]) => void>(
  callback: T,
  delay: number,
) => {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastCall < delay) return;

    lastCall = now;

    callback(...args);
  };
};
