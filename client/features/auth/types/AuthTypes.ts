export interface SigninRequest {
  email: string;
  password: string;
}

export interface SigninResponse {
  userId: number;
  fullName: string;
  email: string;
  profilePhotoUrl?: string;
  token: string;
}

export interface GoogleSigninRequest {
  idToken: string;
}
