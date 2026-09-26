import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export enum UserRole {
    admin = "admin",
    teacher = "teacher",
    student = "student",
    staff = "staff",
}

export class CreateUserDto {
    @ApiProperty({ name: "name", type: "string", example: "john" })
    @IsString()
    @IsNotEmpty()
    name!: string;

    @ApiProperty({ name: "accessToken" })
    @IsString()
    @IsOptional()
    accessToken?: string;

    @ApiProperty({ name: "email", type: "string", example: "demo@gmail.com" })
    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @ApiProperty({ name: "password", type: "string", example: "xxxxxxxxxxxxxx" })
    @IsString()
    @IsNotEmpty()
    password!: string;

    @ApiProperty({ name: "role" })
    @IsEnum(UserRole, { message: "Please add a valid role." })
    @IsNotEmpty()
    role!: UserRole;

    @ApiProperty({ name: "isActive", type: "boolean" })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    // Page keys this user may open, overriding the defaults for their role.
    // Omit to keep role defaults; send null to clear an existing override.
    @ApiProperty({ name: "permissions", type: [String], required: false, example: ["dashboard", "students"] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    permissions?: string[] | null;
}
