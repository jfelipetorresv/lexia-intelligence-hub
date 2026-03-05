import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/onedrive";
import { Client } from "@microsoft/microsoft-graph-client";

export async function GET() {
  const diagnostics: Record<string, unknown> = {};

  try {
    const token = await getAccessToken();
    diagnostics.tokenOk = true;
    diagnostics.tokenPreview = token.substring(0, 20) + "...";

    const client = Client.init({
      authProvider: (done) => done(null, token),
    });

    // 1. Check what users exist (client_credentials can list users)
    try {
      const users = await client.api("/users").select("displayName,mail,id").top(5).get();
      diagnostics.users = users.value.map((u: Record<string, unknown>) => ({
        id: u.id,
        name: u.displayName,
        mail: u.mail,
      }));
    } catch (e) {
      diagnostics.usersError = e instanceof Error ? e.message : String(e);
    }

    // 2. Check SharePoint sites
    try {
      const sites = await client.api("/sites?search=*").top(5).get();
      diagnostics.sites = sites.value.map((s: Record<string, unknown>) => ({
        id: s.id,
        name: s.displayName,
        webUrl: s.webUrl,
      }));
    } catch (e) {
      diagnostics.sitesError = e instanceof Error ? e.message : String(e);
    }

    // 3. If we have a user, try their drive
    if (diagnostics.users && (diagnostics.users as Array<Record<string, unknown>>).length > 0) {
      const firstUserId = (diagnostics.users as Array<Record<string, unknown>>)[0].id;
      try {
        const drive = await client.api(`/users/${firstUserId}/drive`).get();
        diagnostics.userDrive = { id: drive.id, name: drive.name, driveType: drive.driveType };

        // Try listing root of first user's drive
        const rootItems = await client.api(`/users/${firstUserId}/drive/root/children`).top(10).get();
        diagnostics.userDriveRoot = rootItems.value.map((i: Record<string, unknown>) => i.name);
      } catch (e) {
        diagnostics.userDriveError = e instanceof Error ? e.message : String(e);
      }
    }
  } catch (e) {
    diagnostics.tokenOk = false;
    diagnostics.error = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
