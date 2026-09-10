/* eslint-disable @typescript-eslint/no-explicit-any */
type NotificationRecord = {
  id: string;
  profile_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

export async function createNotificationForProfiles(
  supabase: any,
  profileIds: string[],
  title: string,
  message: string,
  type: string,
): Promise<NotificationRecord[]> {
  const uniqueProfileIds = [...new Set(profileIds.filter(Boolean))];

  if (uniqueProfileIds.length === 0) {
    return [];
  }

  const rows = uniqueProfileIds.map((profileId) => ({
    profile_id: profileId,
    title: title.trim(),
    message: message.trim(),
    type: type.trim(),
    is_read: false,
  }));

  const { data, error } = await supabase.from("notifications").insert(rows).select();

  if (error) {
    console.error("Failed to create notifications:", {
      title,
      bodyMessage: message,
      type,
      profileIds: uniqueProfileIds,
      code: error.code,
      details: error.details,
      errorMessage: error.message,
    });
    return [];
  }

  return (data as NotificationRecord[]) ?? [];
}

export async function createNotificationForProfile(
  supabase: any,
  profileId: string | null,
  title: string,
  message: string,
  type: string,
): Promise<NotificationRecord | null> {
  if (!profileId) {
    return null;
  }

  const [row] = await createNotificationForProfiles(supabase, [profileId], title, message, type);
  return row ?? null;
}

export async function getProfileIdsByRoles(
  supabase: any,
  roles: string[],
): Promise<string[]> {
  try {
    const { data } = await supabase.from("profiles").select("id").in("role", roles);
    return (data ?? []).map((row: { id: string }) => row.id);
  } catch (error) {
    console.error("Failed to query profiles by role:", error);
    return [];
  }
}
