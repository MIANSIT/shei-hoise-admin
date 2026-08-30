import { createNormalClient } from "./client";

// Browser client only. `supabaseAdmin` deliberately does NOT live here — this
// module is imported by client components, and re-exporting the service-role
// client from it inlines the key into the browser bundle. Server code should
// import it from "@/lib/supabase/admin".
export const supabase = createNormalClient();
