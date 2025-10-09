import helmet from "helmet";

export function helmetSecurity() {
  return helmet({
    // Keep defaults; allow static assets if any cross-origin
    crossOriginResourcePolicy: { policy: "cross-origin" },
    // Adjust CSP later if you have known external CDNs
    contentSecurityPolicy: false,
  });
}
