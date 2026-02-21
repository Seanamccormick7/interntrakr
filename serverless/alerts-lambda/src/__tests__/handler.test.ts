import { SESClient } from "@aws-sdk/client-ses";

// --- env setup (must happen before handler import) ---
process.env.API_BASE_URL = "http://api.test";
process.env.INTERNAL_API_KEY = "test-key";
process.env.SES_FROM_EMAIL = "alerts@test.com";

// --- mock SES ---
jest.mock("@aws-sdk/client-ses", () => ({
  SESClient: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  SendEmailCommand: jest.fn().mockImplementation((input) => input),
}));

// --- mock email templates ---
jest.mock("../email-templates", () => ({
  buildEmailSubject: jest.fn().mockReturnValue("Your upcoming deadlines"),
  buildEmailHtml: jest.fn().mockReturnValue("<p>deadlines</p>"),
  buildEmailText: jest.fn().mockReturnValue("deadlines"),
}));

// --- helpers ---
const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockUsersResponse(users: object[]) {
  return {
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue(users),
    text: jest.fn().mockResolvedValue(""),
  };
}

function mockMarkNotifiedResponse() {
  return {
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue({ ok: true }),
    text: jest.fn().mockResolvedValue(""),
  };
}

const sampleUser = {
  email: "user@example.com",
  applications: [
    {
      id: "1",
      company: "Google",
      role: "SWE Intern",
      deadline: new Date(Date.now() + 86400000).toISOString(),
      status: "APPLIED",
    },
  ],
};

describe("alerts lambda handler", () => {
  let sesClientInstance: { send: jest.Mock };
  let handler: typeof import("../handler").handler;
  let getRunDate: typeof import("../handler").getRunDate;

  beforeEach(async () => {
    jest.clearAllMocks();
    // Re-import handler fresh each time so module state is clean
    jest.resetModules();

    // Re-mock after resetModules
    jest.mock("@aws-sdk/client-ses", () => ({
      SESClient: jest.fn().mockImplementation(() => ({
        send: jest.fn().mockResolvedValue({}),
      })),
      SendEmailCommand: jest.fn().mockImplementation((input) => input),
    }));
    jest.mock("../email-templates", () => ({
      buildEmailSubject: jest.fn().mockReturnValue("Your upcoming deadlines"),
      buildEmailHtml: jest.fn().mockReturnValue("<p>deadlines</p>"),
      buildEmailText: jest.fn().mockReturnValue("deadlines"),
    }));

    const handlerModule = await import("../handler");
    handler = handlerModule.handler;
    getRunDate = handlerModule.getRunDate;

    const { SESClient: MockSESClient } = await import("@aws-sdk/client-ses");
    sesClientInstance = (MockSESClient as jest.Mock).mock.results[0]?.value ?? {
      send: jest.fn().mockResolvedValue({}),
    };
  });

  describe("getRunDate", () => {
    it("returns today's date in YYYY-MM-DD format", () => {
      const result = getRunDate();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result).toBe(new Date().toISOString().slice(0, 10));
    });
  });

  describe("handler", () => {
    it("returns early with sent=0 when no users have upcoming deadlines", async () => {
      mockFetch.mockResolvedValueOnce(mockUsersResponse([]));

      const result = await handler();

      expect(result).toEqual({ ok: true, sent: 0, failed: 0 });
      // Should not attempt to send any email
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("passes runDate as query param to the users endpoint", async () => {
      mockFetch
        .mockResolvedValueOnce(mockUsersResponse([]))

      await handler();

      const calledUrl = mockFetch.mock.calls[0][0].toString();
      expect(calledUrl).toContain("runDate=");
      expect(calledUrl).toMatch(/runDate=\d{4}-\d{2}-\d{2}/);
    });

    it("sends an email and marks the user as notified on success", async () => {
      mockFetch
        .mockResolvedValueOnce(mockUsersResponse([sampleUser])) // GET /users/with-deadlines
        .mockResolvedValueOnce(mockMarkNotifiedResponse());       // POST /users/mark-notified

      const result = await handler();

      expect(result).toEqual({ ok: true, sent: 1, failed: 0, total: 1 });

      // Verify mark-notified was called
      const markCall = mockFetch.mock.calls[1];
      expect(markCall[0].toString()).toContain("/users/mark-notified");
      const body = JSON.parse(markCall[1].body);
      expect(body.email).toBe("user@example.com");
      expect(body.runDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("does NOT call mark-notified when SES send fails", async () => {
      mockFetch.mockResolvedValueOnce(mockUsersResponse([sampleUser]));

      // Make SES throw
      sesClientInstance.send.mockRejectedValue(new Error("SES throttled"));

      const result = await handler();

      expect(result).toEqual({ ok: true, sent: 0, failed: 1, total: 1 });

      // Only 1 fetch call (the initial GET) — no mark-notified POST
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("sends to multiple users and marks each one individually", async () => {
      const user2 = { ...sampleUser, email: "user2@example.com" };

      mockFetch
        .mockResolvedValueOnce(mockUsersResponse([sampleUser, user2])) // GET
        .mockResolvedValueOnce(mockMarkNotifiedResponse())              // POST user1
        .mockResolvedValueOnce(mockMarkNotifiedResponse());             // POST user2

      const result = await handler();

      expect(result).toEqual({ ok: true, sent: 2, failed: 0, total: 2 });
      expect(mockFetch).toHaveBeenCalledTimes(3); // 1 GET + 2 POSTs
    });

    it("on retry, only processes users returned by the API (already-notified users are filtered server-side)", async () => {
      // Simulate a retry: API already filtered out previously-notified users,
      // so it only returns the one user that wasn't notified yet.
      mockFetch
        .mockResolvedValueOnce(mockUsersResponse([sampleUser])) // only 1 user returned
        .mockResolvedValueOnce(mockMarkNotifiedResponse());

      const result = await handler();

      expect(result).toEqual({ ok: true, sent: 1, failed: 0, total: 1 });
    });

    it("throws when the users API call fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue("Internal Server Error"),
      });

      await expect(handler()).rejects.toThrow("API responded 500");
    });
  });
});
