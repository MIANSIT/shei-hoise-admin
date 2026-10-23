import "server-only";

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import tls from "node:tls";

/**
 * Minimal SMTP sender (implicit TLS, AUTH LOGIN) with no third-party mail
 * library. Built for Gmail / Google Workspace with an app password:
 *   SMTP_HOST=smtp.gmail.com  SMTP_PORT=465  SMTP_USER  SMTP_PASS  EMAIL_FROM
 */

export const LOGO_CID = "sheihoise-logo";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export class EmailNotConfiguredError extends Error {
  constructor() {
    super(
      "Email is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS in .env.local.",
    );
    this.name = "EmailNotConfiguredError";
  }
}

const TIMEOUT_MS = 20_000;
const EMAIL_RE = /^[^\s<>@"]+@[^\s<>@"]+\.[^\s<>@"]+$/;

/* ------------------------------ SMTP client ------------------------------ */

interface Reply {
  code: number;
  text: string;
}

class SmtpConnection {
  private buffer = "";
  private replies: Reply[] = [];
  private waiters: { resolve: (r: Reply) => void; reject: (e: Error) => void }[] = [];
  private failure: Error | null = null;

  private constructor(private socket: tls.TLSSocket) {
    socket.setEncoding("utf8");
    socket.setTimeout(TIMEOUT_MS, () => this.fail(new Error("SMTP connection timed out")));
    socket.on("data", (chunk: string) => {
      this.buffer += chunk;
      this.parse();
    });
    socket.on("error", (err) => this.fail(err));
    socket.on("close", () => this.fail(new Error("SMTP connection closed unexpectedly")));
  }

  static connect(host: string, port: number): Promise<SmtpConnection> {
    return new Promise((resolve, reject) => {
      const socket = tls.connect({ host, port, servername: host }, () => {
        socket.removeListener("error", reject);
        resolve(new SmtpConnection(socket));
      });
      socket.once("error", reject);
    });
  }

  private fail(err: Error) {
    if (this.failure) return;
    this.failure = err;
    this.waiters.splice(0).forEach((w) => w.reject(err));
    this.socket.destroy();
  }

  // A reply ends at the first line shaped "250 text"; "250-text" continues it.
  private parse() {
    for (;;) {
      const lines = this.buffer.split("\r\n");
      const end = lines.findIndex(
        (line, i) => i < lines.length - 1 && /^\d{3}( |$)/.test(line),
      );
      if (end === -1) return;
      const reply: Reply = {
        code: Number(lines[end].slice(0, 3)),
        text: lines.slice(0, end + 1).join("\n"),
      };
      this.buffer = lines.slice(end + 1).join("\r\n");
      const waiter = this.waiters.shift();
      if (waiter) waiter.resolve(reply);
      else this.replies.push(reply);
    }
  }

  private next(): Promise<Reply> {
    if (this.failure) return Promise.reject(this.failure);
    const queued = this.replies.shift();
    if (queued) return Promise.resolve(queued);
    return new Promise((resolve, reject) => this.waiters.push({ resolve, reject }));
  }

  async expect(codes: number[]): Promise<Reply> {
    const reply = await this.next();
    if (!codes.includes(reply.code)) {
      throw new Error(`SMTP error ${reply.code}: ${reply.text.split("\n")[0].slice(4)}`);
    }
    return reply;
  }

  async command(line: string, codes: number[]): Promise<Reply> {
    this.socket.write(`${line}\r\n`);
    return this.expect(codes);
  }

  end() {
    this.socket.end();
  }
}

/* ------------------------------ MIME helpers ----------------------------- */

const b64 = (data: Buffer | string) =>
  Buffer.from(data).toString("base64").replace(/(.{76})/g, "$1\r\n");

// RFC 2047 so non-ASCII subjects (e.g. the Taka sign) survive transport.
const encodeHeader = (value: string) =>
  /^[\x20-\x7e]*$/.test(value)
    ? value
    : `=?UTF-8?B?${Buffer.from(value).toString("base64")}?=`;

function parseFrom(from: string): { name: string; address: string } {
  const match = from.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  return match
    ? { name: match[1].trim(), address: match[2].trim() }
    : { name: "", address: from.trim() };
}

function buildMessage(opts: {
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
  logo: Buffer;
  domain: string;
}) {
  const rel = `rel_${crypto.randomBytes(12).toString("hex")}`;
  const alt = `alt_${crypto.randomBytes(12).toString("hex")}`;
  const { name, address } = parseFrom(opts.from);
  const fromHeader = name ? `${encodeHeader(name)} <${address}>` : address;

  const lines = [
    `From: ${fromHeader}`,
    `To: ${opts.to}`,
    ...(opts.replyTo ? [`Reply-To: ${opts.replyTo}`] : []),
    `Subject: ${encodeHeader(opts.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@${opts.domain}>`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/related; boundary="${rel}"`,
    "",
    `--${rel}`,
    `Content-Type: multipart/alternative; boundary="${alt}"`,
    "",
    `--${alt}`,
    'Content-Type: text/plain; charset="utf-8"',
    "Content-Transfer-Encoding: base64",
    "",
    b64(opts.text),
    `--${alt}`,
    'Content-Type: text/html; charset="utf-8"',
    "Content-Transfer-Encoding: base64",
    "",
    b64(opts.html),
    `--${alt}--`,
    `--${rel}`,
    'Content-Type: image/png; name="shei-hoise-logo.png"',
    "Content-Transfer-Encoding: base64",
    `Content-ID: <${LOGO_CID}>`,
    'Content-Disposition: inline; filename="shei-hoise-logo.png"',
    "",
    b64(opts.logo),
    `--${rel}--`,
    "",
  ];

  // Dot-stuff so a line that is just "." can't end the DATA section early.
  return lines.join("\r\n").replace(/^\./gm, "..");
}

/* --------------------------------- public -------------------------------- */

/**
 * Sends a branded email. The logo is attached inline (cid) so it shows in every
 * mail client without needing a publicly reachable image URL - this admin app
 * is not hosted on a public address.
 */
export async function sendEmail({ to, subject, html, text }: SendEmailInput) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) throw new EmailNotConfiguredError();

  if (!EMAIL_RE.test(to)) throw new Error("Invalid recipient email address.");

  const port = Number(process.env.SMTP_PORT ?? 465);
  const from = process.env.EMAIL_FROM ?? `Shei Hoise <${user}>`;
  const { address: fromAddress } = parseFrom(from);

  const logo = await fs.readFile(path.join(process.cwd(), "public", "logo_beta.png"));
  const message = buildMessage({
    from,
    to,
    replyTo: process.env.EMAIL_REPLY_TO || undefined,
    subject,
    html,
    text,
    logo,
    domain: fromAddress.split("@")[1] ?? "localhost",
  });

  const smtp = await SmtpConnection.connect(host, port);
  try {
    await smtp.expect([220]);
    await smtp.command(`EHLO ${fromAddress.split("@")[1] ?? "localhost"}`, [250]);
    await smtp.command("AUTH LOGIN", [334]);
    await smtp.command(Buffer.from(user).toString("base64"), [334]);
    await smtp.command(Buffer.from(pass).toString("base64"), [235]);
    await smtp.command(`MAIL FROM:<${fromAddress}>`, [250]);
    await smtp.command(`RCPT TO:<${to}>`, [250, 251]);
    await smtp.command("DATA", [354]);
    await smtp.command(`${message}\r\n.`, [250]);
    await smtp.command("QUIT", [221]).catch(() => undefined);
  } finally {
    smtp.end();
  }
}
