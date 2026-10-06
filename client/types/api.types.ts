export interface ApiResponse {
  status: number;
  message: string;
}

export interface ApiDataResponse<T> extends ApiResponse {
  data: T;
}

export interface CursorPagedResult<T> {
  items: T[];
  pageSize: number;
  hasNextPage: boolean;
  nextCursor: string | null;
}

export type PageSize = 10 | 20 | 50 | 100;
