import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(12)
  password!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  fullName!: string;
}

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  password!: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  currentPassword!: string;

  @ApiProperty()
  @IsString()
  @MinLength(12)
  newPassword!: string;
}

export class BootstrapDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  setupToken?: string;
}
