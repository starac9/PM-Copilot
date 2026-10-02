// Where to send someone after they sign in: back to the protected page that bounced them
// to /login (ProtectedRoute stores it in location.state.from), else the dashboard. Only
// same-app paths are honored, so a crafted link can't redirect off-site.
export function afterAuthPath(location) {
  const from = location?.state?.from;
  return typeof from === "string" && from.startsWith("/") && !from.startsWith("//")
    ? from
    : "/dashboard";
}
