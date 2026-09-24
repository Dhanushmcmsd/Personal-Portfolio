const GOOGLE_SITE_VERIFICATION =
  "google-site-verification: googleddc3049008de77ea.html";

export function GET() {
  return new Response(GOOGLE_SITE_VERIFICATION, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
