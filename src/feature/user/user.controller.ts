import { Controller, Post, Body, UseGuards, Req, Patch } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/guards/roles.decorator';
import { UserType } from 'src/common/types/enums/user.enum';
import { Request } from 'express';

// req.user; // Your JWT payload
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserType.USER)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Req() req: Request, @Body() createUserDto: CreateUserDto) {
    const authId = req?.user?.sub;
    return this.userService.create(authId, createUserDto);
  }

  @Patch()
  update(@Req() req: Request, @Body() updateUserDto: UpdateUserDto) {
    const authId = req?.user?.sub;
    return this.userService.update(authId, updateUserDto);
  }
}
