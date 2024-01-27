class Debouncer {
  delay: number;
  timeout: number | null = null;
  constructor({ delay }: { delay: number }) {
    this.delay = delay;
  }

  exec(fn: () => void, { delay } = { delay: this.delay }) {
    this.timeout !== null && clearTimeout(this.timeout);
    const timeout = setTimeout(fn, delay);
    this.timeout = timeout;
  }
}

export default Debouncer;
