import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import {
  buildEmailSubject,
  buildEmailHtml,
  buildEmailText,
} from "./email-templates";

type ApplicationDeadline = {
  id: string;
  company: string;
  role: string;
  deadline: string;
  link?: string;
  status: string;
};

type UserWithDeadlines = {
  email: string;
  applications: ApplicationDeadline[];
};

const API_BASE_URL = process.env.API_BASE_URL!;
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY!;
const SES_FROM_EMAIL = process.env.SES_FROM_EMAIL!;
const SES_REGION = process.env.SES_REGION || "us-west-1";
const ALERT_WINDOW_DAYS = Number(process.env.ALERT_WINDOW_DAYS ?? "7");

if (!API_BASE_URL) {
  throw new Error("Missing required env: API_BASE_URL");
}
if (!INTERNAL_API_KEY) {
  throw new Error("Missing required env: INTERNAL_API_KEY");
}
if (!SES_FROM_EMAIL) {
  throw new Error("Missing required env: SES_FROM_EMAIL");
}

const sesClient = new SESClient({ region: SES_REGION });

async function fetchUsersWithDeadlines(): Promise<UserWithDeadlines[]> {
  const url = new URL("/users/with-deadlines", API_BASE_URL);
  url.searchParams.set("days", String(ALERT_WINDOW_DAYS));

  console.log(`Calling API: ${url.toString()}`);

  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      "x-api-key": INTERNAL_API_KEY,
    },
  });

  if (!res.ok) {
    throw new Error(`API responded ${res.status}: ${await res.text()}`);
  }

  const users = (await res.json()) as UserWithDeadlines[];
  console.log(`API response:`, JSON.stringify(users));

  return users;
}

async function sendEmailToUser(
  user: UserWithDeadlines,
): Promise<{ success: boolean; error?: string }> {
  try {
    const subject = buildEmailSubject(user.applications.length);
    const htmlBody = buildEmailHtml(user);
    const textBody = buildEmailText(user);

    const command = new SendEmailCommand({
      Source: SES_FROM_EMAIL,
      Destination: {
        ToAddresses: [user.email],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: "UTF-8",
          },
          Text: {
            Data: textBody,
            Charset: "UTF-8",
          },
        },
      },
    });

    await sesClient.send(command);
    console.log(` Email sent successfully to ${user.email}`);
    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    console.error(` Failed to send email to ${user.email}:`, error.message);
    return { success: false, error: error.message };
  }
}

export const handler = async () => {
  console.log(` Starting alerts lambda (window: ${ALERT_WINDOW_DAYS} days)`);

  try {
    const users = await fetchUsersWithDeadlines();
    console.log(` Found ${users.length} user(s) with upcoming deadlines`);

    if (users.length === 0) {
      console.log(" No users with deadlines, exiting");
      return { ok: true, sent: 0, failed: 0 };
    }

    const results = await Promise.all(users.map(sendEmailToUser));

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(` Summary: ${sent} sent, ${failed} failed`);

    return { ok: true, sent, failed, total: users.length };
  } catch (err: unknown) {
    const error = err as Error;
    console.error(" Lambda error:", error?.stack || error);
    throw err;
  }
};
