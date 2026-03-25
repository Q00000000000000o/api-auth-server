import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  EducationDetails,
  UserRole,
  WorkExperienceDetails,
} from "../backend.d";
import { useActor } from "./useActor";

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useOwnResume() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["ownResume"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getOwnFullResume();
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddWorkExperience() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      workExperience,
    }: {
      userId: Principal;
      workExperience: WorkExperienceDetails;
    }) => {
      if (!actor) throw new Error("未连接");
      return actor.addWorkExperience(userId, workExperience);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ownResume"] });
    },
  });
}

export function useAddEducation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      education,
    }: {
      userId: Principal;
      education: EducationDetails;
    }) => {
      if (!actor) throw new Error("未连接");
      return actor.addEducation(userId, education);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ownResume"] });
    },
  });
}

export function useAssignRole() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({ user, role }: { user: Principal; role: UserRole }) => {
      if (!actor) throw new Error("未连接");
      return actor.assignCallerUserRole(user, role);
    },
  });
}
