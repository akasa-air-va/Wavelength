import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

class CloudStorage {

  async get(key) {
    const { data, error } = await supabase
      .from("game_state")
      .select("value")
      .eq("key", key)
      .single();

    if (error) throw error;
    return { key, value: data.value };
  }

  async set(key, value) {
    const { error } = await supabase
      .from("game_state")
      .upsert({ key, value });

    if (error) throw error;

    return { key, value };
  }

  async delete(key) {
    const { error } = await supabase
      .from("game_state")
      .delete()
      .eq("key", key);

    if (error) throw error;

    return { key, deleted: true };
  }

  async list(prefix = "") {
    const { data, error } = await supabase
      .from("game_state")
      .select("key")
      .like("key", `${prefix}%`);

    if (error) throw error;

    return { keys: data.map(d => d.key) };
  }

  subscribe(callback) {
    return supabase
      .channel("realtime-games")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_state" },
        payload => callback(payload)
      )
      .subscribe();
  }
}

const storage = new CloudStorage();
export default storage;
