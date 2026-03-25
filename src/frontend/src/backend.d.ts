import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type UserId = Principal;
export interface EducationDetails {
    major: string;
    endDate?: Time;
    school: string;
    degree: string;
    startDate: Time;
}
export type Time = bigint;
export interface WorkExperienceDetails {
    title: string;
    endDate?: Time;
    description: string;
    company: string;
    startDate: Time;
}
export interface Resume {
    name: string;
    educations: Array<EducationDetails>;
    email: string;
    company: string;
    position: string;
    workExperiences: Array<WorkExperienceDetails>;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addEducation(userId: UserId, education: EducationDetails): Promise<void>;
    addWorkExperience(userId: UserId, workExperience: WorkExperienceDetails): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getCallerUserProfile(): Promise<Resume | null>;
    getCallerUserRole(): Promise<UserRole>;
    getOwnFullResume(): Promise<Resume>;
    isCallerAdmin(): Promise<boolean>;
}
