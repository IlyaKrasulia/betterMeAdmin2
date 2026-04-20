export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  userId: string
  email: string
  userName: string
}

export interface MeResponse {
  userId: string
  email: string
  userName: string
  profileId: string
}

export interface SignupRequest {
  email: string
  password: string
}

export interface SignupResponse {
  userId: string
  email: string
  userName: string
}
