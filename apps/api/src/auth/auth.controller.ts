import { Body, Controller, Get, Patch, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ChangePasswordDto, LoginDto, RegisterDto } from './dto';
import { CurrentUser, Public, RequirePermissions } from '../common/decorators';
import { AuthUser } from '../common/auth.types';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.auth.login(dto, res, req.ip, req.headers['user-agent']);
  }

  @Public()
  @Post('refresh')
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.auth.refresh(req.cookies?.refresh_token, res, req.ip, req.headers['user-agent']);
  }

  @Post('logout')
  logout(@CurrentUser() user: AuthUser, @Res({ passthrough: true }) res: Response) {
    return this.auth.logout(user.sessionId, res);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }

  @Patch('password')
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(user.id, dto.currentPassword, dto.newPassword);
  }

  @Patch('locale')
  locale(@CurrentUser() user: AuthUser, @Body() body: { locale: 'en' | 'ar' }) {
    return this.auth.updateLocale(user.id, body.locale);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('bootstrap')
  bootstrap(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.auth.bootstrap(res, req.ip, req.headers['user-agent']);
  }

  @Get('admin/ping')
  @RequirePermissions('users.manage')
  adminPing() {
    return { ok: true };
  }
}
