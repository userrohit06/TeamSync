import { ApiResponse } from "@/commonTypes/ApiResponse";
import { baseApi } from "@/redux/api/baseApi";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    signup: builder.mutation<ApiResponse, FormData>({
      query: (formData) => ({
        url: "/auth/signup",
        method: "POST",
        body: formData,
      }),
    }),
  }),
});

export const { useSignupMutation } = authApi;
