// Supabase's functions.invoke() hides the response body behind a generic
// message. This pulls out the { error } message our edge functions return.
export async function getFunctionErrorMessage(error) {
  try {
    const body = await error.context.json();
    return body?.error || error.message;
  } catch {
    return error?.message || "Something went wrong. Please try again.";
  }
}