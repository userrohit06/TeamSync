import { PageSize } from "@/types";

export type UserStatusMode = "All" | "Active" | "Inactive";

export type UserStatus = "Active" | "Inactive";

export interface UserResponseDTO {
  userId: number;
  fullName: string;
  email: string;
  profilePhoto?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  status: UserStatus;
}

export interface GetUsersParams {
  pageSize: PageSize;
  cursor?: string | null;
  searchTerm?: string;
  mode?: UserStatusMode;
}
