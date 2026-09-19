import { ApiDataResponse, ApiResponse } from "@/commonTypes/ApiResponse";
import {
  GoogleSigninRequest,
  SigninRequest,
  SigninResponse,
} from "@/features/auth/types/AuthTypes";
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

    signin: builder.mutation<ApiDataResponse<SigninResponse>, SigninRequest>({
      query: (payload) => ({
        url: "/auth/signin",
        method: "POST",
        body: payload,
      }),
    }),

    googleSignin: builder.mutation<
      ApiDataResponse<SigninResponse>,
      GoogleSigninRequest
    >({
      query: (payload) => ({
        url: "/auth/google",
        method: "POST",
        body: payload,
      }),
    }),
  }),
});

export const { useSignupMutation, useSigninMutation, useGoogleSigninMutation } =
  authApi;
