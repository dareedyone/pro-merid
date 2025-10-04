import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { AnchorService } from '../services/anchor.service';
import { AnchorUserService } from '../services/anchor-user.service';
import {
  UpdateAnchorDto,
  AnchorResponseDto,
  AddUserToAnchorDto,
  RemoveUserFromAnchorDto,
  AnchorUserListResponseDto,
} from '../dtos/anchor.dto';
import { AnchorConfig } from '../types/anchor.types';
import { RequestWithUser } from 'src/common/types/request.types';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/guards/roles.decorator';
import { UserType } from 'src/common/types/enums/user.enum';

@Controller('anchor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserType.ANCHOR)
export class AnchorController {
  constructor(
    private readonly anchorService: AnchorService,
    private readonly anchorUserService: AnchorUserService,
  ) {}

  @Get()
  async getMyAnchor(
    @Request() req: RequestWithUser,
  ): Promise<AnchorResponseDto> {
    const anchorId = req.user.anchorId;
    if (!anchorId) {
      throw new BadRequestException('User is not associated with an anchor');
    }
    return this.anchorService.getAnchorById(anchorId);
  }

  @Put()
  async updateMyAnchor(
    @Body() dto: UpdateAnchorDto,
    @Request() req: RequestWithUser,
  ): Promise<AnchorResponseDto> {
    const anchorId = req.user.anchorId;
    if (!anchorId) {
      throw new BadRequestException('User is not associated with an anchor');
    }
    return this.anchorService.updateAnchor(anchorId, dto);
  }

  @Get('config')
  async getMyAnchorConfig(
    @Request() req: RequestWithUser,
  ): Promise<AnchorConfig> {
    const anchorId = req.user.anchorId;
    if (!anchorId) {
      throw new BadRequestException('User is not associated with an anchor');
    }
    return this.anchorService.getAnchorConfig(anchorId);
  }

  @Put('config')
  async updateMyAnchorConfig(
    @Body() config: Partial<AnchorConfig>,
    @Request() req: RequestWithUser,
  ): Promise<AnchorConfig> {
    const anchorId = req.user.anchorId;
    if (!anchorId) {
      throw new BadRequestException('User is not associated with an anchor');
    }
    return this.anchorService.updateAnchorConfig(anchorId, config);
  }

  @Post('users')
  async addUserToMyAnchor(
    @Body() dto: AddUserToAnchorDto,
    @Request() req: RequestWithUser,
  ): Promise<any> {
    const anchorId = req.user.anchorId;
    if (!anchorId) {
      throw new BadRequestException('User is not associated with an anchor');
    }
    return this.anchorUserService.addUserToAnchor(anchorId, dto);
  }

  @Delete('users')
  async removeUserFromMyAnchor(
    @Body() dto: RemoveUserFromAnchorDto,
    @Request() req: RequestWithUser,
  ): Promise<void> {
    const anchorId = req.user.anchorId;
    if (!anchorId) {
      throw new BadRequestException('User is not associated with an anchor');
    }
    return this.anchorUserService.removeUserFromAnchor(anchorId, dto);
  }

  @Get('users')
  async getMyAnchorUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Request() req: RequestWithUser,
  ): Promise<AnchorUserListResponseDto> {
    const anchorId = req.user.anchorId;
    if (!anchorId) {
      throw new BadRequestException('User is not associated with an anchor');
    }
    return this.anchorUserService.getAnchorUsers(anchorId, page, limit);
  }

  @Get('users/stats')
  async getMyAnchorUserStats(@Request() req: RequestWithUser): Promise<any> {
    const anchorId = req.user.anchorId;
    if (!anchorId) {
      throw new BadRequestException('User is not associated with an anchor');
    }
    return this.anchorUserService.getAnchorUserStats(anchorId);
  }
}
