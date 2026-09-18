export interface ApiResponse {
  status: number;
  message: string;
}

export interface ApiDataResponse<T> extends ApiResponse {
  data: T;
}
