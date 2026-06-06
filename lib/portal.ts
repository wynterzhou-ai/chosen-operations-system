import { createClient } from "@/lib/supabase/server";
import type { Client, ClientUser } from "@/types/database";

export type PortalContext = {
  clientUser: ClientUser;
  client: Client;
};

export async function getPortalContext(): Promise<{ context: PortalContext | null; error: string | null }> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError) return { context: null, error: userError.message };
  if (!user) return { context: null, error: "Please log in to access the customer portal." };

  const { data, error } = await supabase
    .from("client_users")
    .select("*, clients(*)")
    .eq("auth_user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (error) return { context: null, error: error.message };
  if (!data?.clients) return { context: null, error: "No active customer portal access was found for this account." };

  return {
    context: {
      clientUser: data as ClientUser,
      client: data.clients as Client
    },
    error: null
  };
}
