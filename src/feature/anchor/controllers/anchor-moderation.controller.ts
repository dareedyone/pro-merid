import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
} from '@nestjs/common';
import { RequestWithUser } from 'src/common/types/request.types';
import { AnchorModerationService } from '../services/anchor-moderation.service';
import {
  FacilitateMatchDto,
  ModerateChatDto,
  AssignCounselorDto,
  ModerationListResponseDto,
  ChatModerationContextDto,
  MatchModerationContextDto,
} from '../dtos/anchor-moderation.dto';

@Controller('anchor/moderation')
export class AnchorModerationController {
  constructor(private readonly moderationService: AnchorModerationService) {}

  @Post('matches/facilitate')
  async facilitateMatch(
    @Body() dto: FacilitateMatchDto,
    @Request() req: RequestWithUser,
  ): Promise<MatchModerationContextDto> {
    const counselorId = req.user.sub;
    const anchorId = req.user.anchorId;
    if (!anchorId) {
      throw new BadRequestException('User is not associated with an anchor');
    }
    return this.moderationService.facilitateMatch(anchorId, dto, counselorId);
  }

  @Put('matches/:matchId/approve')
  async approveMatch(
    @Param('matchId') matchId: string,
    @Request() req: RequestWithUser,
  ): Promise<void> {
    const counselorId = req.user.sub;
    const anchorId = req.user.anchorId;
    if (!anchorId) {
      throw new BadRequestException('User is not associated with an anchor');
    }
    return this.moderationService.approveMatch(anchorId, matchId, counselorId);
  }

  @Put('matches/:matchId/reject')
  async rejectMatch(
    @Param('matchId') matchId: string,
    @Body() body: { reason?: string },
    @Request() req: RequestWithUser,
  ): Promise<void> {
    const counselorId = req.user.sub;
    const anchorId = req.user.anchorId;
    if (!anchorId) {
      throw new BadRequestException('User is not associated with an anchor');
    }
    return this.moderationService.rejectMatch(
      anchorId,
      matchId,
      counselorId,
      body.reason,
    );
  }

  @Post('chats/moderate')
  async moderateChat(
    @Body() dto: ModerateChatDto,
    @Request() req: RequestWithUser,
  ): Promise<ChatModerationContextDto> {
    const counselorId = req.user.sub;
    const anchorId = req.user.anchorId;
    if (!anchorId) {
      throw new BadRequestException('User is not associated with an anchor');
    }
    return this.moderationService.moderateChat(anchorId, dto, counselorId);
  }

  @Post('chats/assign-counselor')
  async assignCounselor(
    @Body() dto: AssignCounselorDto,
    @Request() req: RequestWithUser,
  ): Promise<void> {
    const adminId = req.user.sub;
    const anchorId = req.user.anchorId;
    if (!anchorId) {
      throw new BadRequestException('User is not associated with an anchor');
    }
    return this.moderationService.assignCounselor(anchorId, dto, adminId);
  }

  @Get('actions')
  async getModerationActions(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Request() req: RequestWithUser,
  ): Promise<ModerationListResponseDto> {
    const anchorId = req.user.anchorId;
    if (!anchorId) {
      throw new BadRequestException('User is not associated with an anchor');
    }
    return this.moderationService.getModerationActions(anchorId, page, limit);
  }

  @Get('chats/:chatId/context')
  async getChatModerationContext(
    @Param('chatId') chatId: string,
    @Request() req: RequestWithUser,
  ): Promise<ChatModerationContextDto> {
    const anchorId = req.user.anchorId;
    if (!anchorId) {
      throw new BadRequestException('User is not associated with an anchor');
    }
    return this.moderationService.getChatModerationContext(anchorId, chatId);
  }

  @Get('matches/:matchId/context')
  async getMatchModerationContext(
    @Param('matchId') matchId: string,
    @Request() req: RequestWithUser,
  ): Promise<MatchModerationContextDto> {
    const anchorId = req.user.anchorId;
    if (!anchorId) {
      throw new BadRequestException('User is not associated with an anchor');
    }
    return this.moderationService.getMatchModerationContext(anchorId, matchId);
  }
}
