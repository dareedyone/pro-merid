import {
  Controller,
  // Get,
  Post,
  Body,
  UseGuards,
  Req,
  // Patch,
  // Param,
  // Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/user.dto';
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

  @Post('onboard')
  create(@Req() req: Request, @Body() createUserDto: CreateUserDto) {
    const authId = req?.user?.sub;
    return this.userService.onboard(authId, createUserDto);
  }

  // @Get()
  // findAll() {
  //   return this.userService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.userService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  //   return this.userService.update(+id, updateUserDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.userService.remove(+id);
  // }
}
