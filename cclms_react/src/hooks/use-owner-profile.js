import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { changeOwnerPassword, getCurrentOwnerProfile, updateOwnerProfile } from "@/lib/api/profile"

export const OWNER_PROFILE_QUERY_KEY = ["owner-profile"]

export function useOwnerProfile() {
  const queryClient = useQueryClient()
  const profileQuery = useQuery({
    queryKey: OWNER_PROFILE_QUERY_KEY,
    queryFn: getCurrentOwnerProfile,
  })
  const updateMutation = useMutation({
    mutationFn: updateOwnerProfile,
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(OWNER_PROFILE_QUERY_KEY, updatedProfile)
    },
  })
  const passwordMutation = useMutation({ mutationFn: changeOwnerPassword })

  return { profileQuery, updateMutation, passwordMutation }
}
