import {
  GetUsersParams,
  UserResponseDTO,
} from "@/features/users/types/user.types";
import { baseApi } from "@/store";
import { ApiDataResponse, CursorPagedResult } from "@/types";

export const userApi = baseApi
  .enhanceEndpoints({ addTagTypes: ["User"] })
  .injectEndpoints({
    endpoints: (builder) => ({
      getUsers: builder.query<
        ApiDataResponse<CursorPagedResult<UserResponseDTO>>,
        GetUsersParams
      >({
        query: ({ pageSize, cursor, searchTerm, mode = "Active" }) => {
          const params = new URLSearchParams();
          params.set("PageSize", pageSize.toString());
          params.set("mode", mode);

          if (cursor) {
            params.set("Cursor", cursor);
          }

          if (searchTerm?.trim()) {
            params.set("SearchTerm", searchTerm.trim());
          }

          return {
            url: `/User?${params.toString()}`,
            method: "GET",
          };
        },

        providesTags: (result) => {
          const items = result?.data.items ?? [];

          return [
            { type: "User" as const, id: "LIST" },
            ...items.map((u) => ({ type: "User" as const, id: u.userId })),
          ];
        },
      }),
    }),
  });

export const { useGetUsersQuery, useLazyGetUsersQuery } = userApi;
