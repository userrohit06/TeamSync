// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const throttle = <T extends (...args: any[]) => any>(
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

export default throttle;
