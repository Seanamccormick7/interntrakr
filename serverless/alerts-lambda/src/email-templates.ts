type ApplicationDeadline = {
  id: string;
  company: string;
  role: string;
  deadline: string;
  link?: string;
  status: string;
};

type UserEmailData = {
  email: string;
  applications: ApplicationDeadline[];
};

const BRAND_COLOR = "#6366f1";
const BG_DARK = "#0b0b0f";
const SURFACE_DARK = "#121218";
const BORDER = "#21212b";
const TEXT_COLOR = "#e7e9ee";
const MUTED_COLOR = "#9aa0ad";

function formatDeadline(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) return `In ${diffDays} days`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusColor(status: string): string {
  switch (status.toUpperCase()) {
    case "SAVED":
      return "#9aa0ad";
    case "APPLIED":
      return "#3b82f6";
    case "OA":
      return "#f59e0b";
    case "INTERVIEW":
      return "#10b981";
    case "REJECTED":
      return "#ef4444";
    case "OFFER":
      return "#10b981";
    default:
      return MUTED_COLOR;
  }
}

export function buildEmailSubject(applicationCount: number): string {
  if (applicationCount === 1) {
    return "🔔 You have 1 application deadline coming up";
  }
  return `🔔 You have ${applicationCount} application deadlines coming up`;
}

export function buildEmailHtml(userData: UserEmailData): string {
  const { applications } = userData;

  const applicationRows = applications
    .map(
      (app) => `
    <tr>
      <td style="padding: 20px; background: ${SURFACE_DARK}; border: 1px solid ${BORDER}; border-radius: 10px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td>
              <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px;">
                <div>
                  <h3 style="margin: 0 0 4px 0; color: ${TEXT_COLOR}; font-size: 18px; font-weight: 600;">
                    ${app.company}
                  </h3>
                  <p style="margin: 0; color: ${MUTED_COLOR}; font-size: 14px;">
                    ${app.role}
                  </p>
                </div>
                <div style="background: ${getStatusColor(app.status)}22; color: ${getStatusColor(app.status)}; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; white-space: nowrap;">
                  ${app.status}
                </div>
              </div>
              
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                <span style="color: ${BRAND_COLOR}; font-weight: 600; font-size: 16px;">
                  ⏰ ${formatDeadline(app.deadline)}
                </span>
                <span style="color: ${MUTED_COLOR}; font-size: 14px;">
                  ${new Date(app.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>

              ${
                app.link
                  ? `
              <a href="${app.link}" style="display: inline-block; background: ${BRAND_COLOR}; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                View Application →
              </a>
              `
                  : ""
              }
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr><td style="height: 16px;"></td></tr>
  `,
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Upcoming Application Deadlines</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: ${BG_DARK}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${BG_DARK};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background: ${SURFACE_DARK}; border-radius: 16px; overflow: hidden; box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);">
          
          <tr>
            <td style="padding: 32px 32px 24px 32px; text-align: center; border-bottom: 1px solid ${BORDER};">
              <h1 style="margin: 0; color: ${TEXT_COLOR}; font-size: 24px; font-weight: 700;">
                InternTrackr
              </h1>
              <p style="margin: 8px 0 0 0; color: ${MUTED_COLOR}; font-size: 14px;">
                Upcoming Application Deadlines
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 24px 0; color: ${TEXT_COLOR}; font-size: 16px; line-height: 1.5;">
                You have <strong style="color: ${BRAND_COLOR};">${applications.length}</strong> application${applications.length === 1 ? "" : "s"} with upcoming deadlines:
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                ${applicationRows}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 32px 32px 32px; text-align: center; border-top: 1px solid ${BORDER};">
              <p style="margin: 0 0 16px 0; color: ${MUTED_COLOR}; font-size: 14px;">
                Don't miss these deadlines!
              </p>
              <a href="${process.env.WEB_APP_URL || "https://interntrakr.com"}" style="display: inline-block; background: ${BRAND_COLOR}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Open InternTrackr
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding: 20px 32px; text-align: center; background: ${BG_DARK};">
              <p style="margin: 0; color: ${MUTED_COLOR}; font-size: 12px;">
                You're receiving this because you have upcoming application deadlines.<br>
                Manage your notifications in InternTrackr settings.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function buildEmailText(userData: UserEmailData): string {
  const { applications } = userData;

  const applicationList = applications
    .map((app) => {
      const deadline = formatDeadline(app.deadline);
      const link = app.link ? `\n  Link: ${app.link}` : "";
      return `
• ${app.company} - ${app.role}
  Status: ${app.status}
  Deadline: ${deadline} (${new Date(app.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })})${link}
      `.trim();
    })
    .join("\n\n");

  return `
InternTrackr - Upcoming Application Deadlines

You have ${applications.length} application${applications.length === 1 ? "" : "s"} with upcoming deadlines:

${applicationList}

Don't miss these deadlines!

Open InternTrackr: https://interntrakr.com

---
You're receiving this because you have upcoming application deadlines.
Manage your notifications in InternTrackr settings.
  `.trim();
}
