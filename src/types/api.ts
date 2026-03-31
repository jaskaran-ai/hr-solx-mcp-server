export interface HealthCheckResponse {
  status: string;
}

export interface Country {
  id: number;
  name: string;
}

export interface State {
  id: number;
  name: string;
}

export interface City {
  id: number;
  name: string;
}

export interface Skill {
  id: number;
  name: string;
}

export interface Language {
  id: number;
  name: string;
}

export interface WorkingStatus {
  id: number;
  name: string;
}

export interface Role {
  id: number;
  name: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  mobile: string;
}

export interface CandidateProfile {
  id: number;
  name: string;
  skills: Skill[];
}
