type AppItem = {
  id: string;
  company: string;
  role: string;
  link?: string;
  deadline?: string;
};

const API_BASE_URL = process.env.API_BASE_URL!;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const ALERT_WINDOW_DAYS = Number(process.env.ALERT_WINDOW_DAYS ?? "7");

if (!API_BASE_URL) {
  throw new Error("Missing required env: API_BASE_URL");
}

// Fix: Remove unused parameters and use unknown instead of any
export const handler = async () => {
  const url = new URL("/applications", API_BASE_URL);
  url.searchParams.set("deadlineSoon", "1");
  try {
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) {
      throw new Error(`API responded ${res.status}`);
    }
    const items = (await res.json()) as AppItem[];

    const text =
      items.length === 0
        ? ` No application deadlines in the next ${ALERT_WINDOW_DAYS} day(s).`
        : ` Upcoming deadlines (next ${ALERT_WINDOW_DAYS} day(s)):\n` +
          items
            .map((a) => {
              const deadline = a.deadline
                ? new Date(a.deadline).toDateString()
                : "N/A";
              const title = `${a.company} — ${a.role}`;
              const link = a.link ? ` <${a.link}|details>` : "";
              return `• ${title} — ${deadline}${link}`;
            })
            .join("\n");

    if (WEBHOOK_URL) {
      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
    }

    return { ok: true, count: items.length };
  } catch (err: unknown) {
    // Fix: Use unknown instead of any
    const error = err as Error;
    console.error("alerts-lambda error:", error?.stack || error);
    throw err;
  }
};
