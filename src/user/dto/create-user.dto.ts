import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export enum UserRole {
    admin = "admin",
    teacher = "teacher",
    student = "student",
    parent = "parent",
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
}
