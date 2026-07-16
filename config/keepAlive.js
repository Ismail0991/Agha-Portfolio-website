// Render's free tier stops an instance after ~15 minutes without inbound traffic, and
// the next visitor then waits ~50s for a cold start. Pinging the service's own public
// URL counts as inbound traffic and holds it awake.
//
// Read this before relying on it:
//   - It CANNOT wake a sleeping instance. Once stopped there is no process left to send
//     the ping, so anything that stops the service (a deploy, a crash, a ping gap) leaves
//     it asleep until a real visitor wakes it. An external monitor has no such blind spot
//     and is the more reliable option -- this is a convenience, not a guarantee.
//   - Staying up 24/7 burns roughly 730 of the 750 free instance hours a month, so one
//     always-on free service fits and a second one will not.
//   - It must hit the PUBLIC url. Pinging localhost never leaves the box and does not
//     count as traffic.

const DEFAULT_MINUTES = 5;

const startKeepAlive = () => {
  if (process.env.KEEP_ALIVE !== "true") return null;

  // Render injects RENDER_EXTERNAL_URL automatically; KEEP_ALIVE_URL overrides it.
  const base = process.env.KEEP_ALIVE_URL || process.env.RENDER_EXTERNAL_URL;

  if (!base) {
    console.warn("KEEP_ALIVE is true but no URL is available.");
    console.warn("  Set KEEP_ALIVE_URL to the public https:// address of this service.");
    return null;
  }

  if (/localhost|127\.0\.0\.1/.test(base)) {
    console.warn(`Keep-alive disabled: ${base} is local, so a ping never counts as traffic.`);
    return null;
  }

  const minutes = Number(process.env.KEEP_ALIVE_MINUTES) || DEFAULT_MINUTES;
  const url = `${base.replace(/\/+$/, "")}/health`;

  const ping = async () => {
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { "User-Agent": "keep-alive" },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) console.warn(`Keep-alive ping got HTTP ${res.status}`);
    } catch (error) {
      // Never throw: a failed ping must not take the server down with it.
      console.warn(`Keep-alive ping failed: ${error.message}`);
    }
  };

  console.log(`Keep-alive enabled: pinging ${url} every ${minutes} min`);

  const timer = setInterval(ping, minutes * 60 * 1000);
  // Do not hold the process open purely for this timer.
  timer.unref();
  return timer;
};

module.exports = { startKeepAlive };
