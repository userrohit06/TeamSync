import { ApiDataResponse, ApiResponse } from "@/types";
import {
  ForgotPasswordRequest,
  GoogleSigninRequest,
  ResetPasswordRequest,
  SigninRequest,
  SigninResponse,
} from "../types";
import { baseApi } from "@/store/api/baseApi";

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

    forgotPassword: builder.mutation<ApiResponse, ForgotPasswordRequest>({
      query: (payload) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body: payload,
      }),
    }),

    resetPassword: builder.mutation<ApiResponse, ResetPasswordRequest>({
      query: (payload) => ({
        url: "/auth/reset-password",
        method: "POST",
        body: payload,
      }),
    }),
  }),
});

export const {
  useSignupMutation,
  useSigninMutation,
  useGoogleSigninMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
