import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
    /**
     * Staff sign in with their email address, pupils with their student number
     * (e.g. 2026483920). The field keeps the name `email` so existing clients
     * are unchanged, but it is validated as a plain string — a student number
     * is not an email address and @IsEmail would reject every pupil.
     */
    @ApiProperty({ name: "email", type: "string", example: "demo@gmail.com or 2026483920" })
    @IsString()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ name: "password", type: "string", example: "123" })
    @IsString()
    @IsNotEmpty()
    password: string;
}

export class ChangePasswordDto {
    @ApiProperty({ name: "currentPassword", type: "string" })
    @IsString()
    @IsNotEmpty()
    currentPassword: string;

    @ApiProperty({ name: "newPassword", type: "string" })
    @IsString()
    @IsNotEmpty()
    newPassword: string;
}
