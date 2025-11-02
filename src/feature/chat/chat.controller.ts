import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  Patch,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
import { MediaService } from './media.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import {
  AddReactionDto,
  RemoveReactionDto,
  ReplyToMessageDto,
} from './dto/reaction.dto';
import { UploadMediaDto } from './dto/media.dto';
import { InitiateCallDto, AnswerCallDto, EndCallDto } from './dto/call.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/guards/roles.decorator';
import { UserType } from 'src/common/types/enums/user.enum';
import { ProfileType } from 'src/common/types/enums/other.enum';
import { Request } from 'express';
import { AuthService } from '../auth/auth.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserType.USER)
@Controller('chats')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly mediaService: MediaService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  async createChat(@Req() req: Request, @Body() createChatDto: CreateChatDto) {
    const authId = req?.user?.sub;
    const { user } = await this.authService.fetchAuthUser(authId);
    return this.chatService.createChat(createChatDto, user.id);
  }

  @Get()
  async getChats(
    @Req() req: Request,
    @Query('profileType') profileType: ProfileType = ProfileType.DATE,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const authId = req?.user?.sub;
    const { user } = await this.authService.fetchAuthUser(authId);
    return this.chatService.getChats(user.id, profileType, page, limit);
  }

  @Get(':chatId')
  async getChat(@Req() req: Request, @Param('chatId') chatId: string) {
    const authId = req?.user?.sub;
    const { user } = await this.authService.fetchAuthUser(authId);
    return this.chatService.getChat(chatId, user.id);
  }

  @Get(':chatId/messages')
  async getMessages(
    @Req() req: Request,
    @Param('chatId') chatId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    const authId = req?.user?.sub;
    const { user } = await this.authService.fetchAuthUser(authId);
    return this.chatService.getMessages(chatId, user.id, page, limit);
  }

  @Post('messages')
  async sendMessage(
    @Req() req: Request,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    const authId = req?.user?.sub;
    const { user } = await this.authService.fetchAuthUser(authId);

    // Get user's profile ID based on the chat's profile type
    // This would need to be determined from the chat or passed in the DTO
    const userProfileId = user.datingProfile?.id || user.friendProfile?.id;

    if (!userProfileId) {
      throw new Error('User profile not found');
    }

    return this.chatService.sendMessage(sendMessageDto, user.id, userProfileId);
  }

  @Patch(':chatId/read')
  async markAsRead(@Req() req: Request, @Param('chatId') chatId: string) {
    const authId = req?.user?.sub;
    const { user } = await this.authService.fetchAuthUser(authId);

    const userProfileId = user.datingProfile?.id || user.friendProfile?.id;

    if (!userProfileId) {
      throw new Error('User profile not found');
    }

    await this.chatService.markAsRead(chatId, user.id, userProfileId);
    return { message: 'Messages marked as read' };
  }

  @Patch(':chatId/archive')
  async archiveChat(@Req() req: Request, @Param('chatId') chatId: string) {
    const authId = req?.user?.sub;
    const { user } = await this.authService.fetchAuthUser(authId);

    await this.chatService.archiveChat(chatId, user.id);
    return { message: 'Chat archived' };
  }

  @Patch(':chatId/block')
  async blockChat(
    @Req() req: Request,
    @Param('chatId') chatId: string,
    @Body() body: { reason?: string },
  ) {
    const authId = req?.user?.sub;
    const { user } = await this.authService.fetchAuthUser(authId);

    await this.chatService.blockChat(chatId, user.id, body.reason);
    return { message: 'Chat blocked' };
  }

  @Delete(':chatId')
  async deleteChat(@Req() req: Request, @Param('chatId') chatId: string) {
    const authId = req?.user?.sub;
    const { user } = await this.authService.fetchAuthUser(authId);

    await this.chatService.deleteChat(chatId, user.id);
    return { message: 'Chat deleted' };
  }

  @Get('usage-stats')
  async getUsageStats(
    @Req() req: Request,
    @Query('profileType') profileType: ProfileType = ProfileType.DATE,
  ) {
    const authId = req?.user?.sub;
    const { user } = await this.authService.fetchAuthUser(authId);

    return this.chatService.getUsageStats(user.id, profileType);
  }

  @Get('upgrade-recommendation')
  async getUpgradeRecommendation(
    @Req() req: Request,
    @Query('profileType') profileType: ProfileType = ProfileType.DATE,
  ) {
    const authId = req?.user?.sub;
    const { user } = await this.authService.fetchAuthUser(authId);

    // This would need to be determined from user's subscription
    const isPremium = false; // TODO: Get from user's subscription
    const isTrueFynd = false; // TODO: Get from user's subscription

    return this.chatService.getUpgradeRecommendation(
      user.id,
      profileType,
      isPremium,
      isTrueFynd,
    );
  }

  // Reaction endpoints
  @Post('reactions')
  async addReaction(
    @Req() req: Request,
    @Body() addReactionDto: AddReactionDto,
  ) {
    const authId = req?.user?.sub;
    const { user } = await this.authService.fetchAuthUser(authId);

    const userProfileId = user.datingProfile?.id || user.friendProfile?.id;
    if (!userProfileId) {
      throw new Error('User profile not found');
    }

    // TODO: Get from user's subscription
    const isPremium = false;
    const isTrueFynd = false;

    return this.chatService.addReaction(
      addReactionDto,
      user.id,
      userProfileId,
      isPremium,
      isTrueFynd,
    );
  }

  @Delete('reactions')
  async removeReaction(
    @Req() req: Request,
    @Body() removeReactionDto: RemoveReactionDto,
  ) {
    const authId = req?.user?.sub;
    const { user } = await this.authService.fetchAuthUser(authId);

    await this.chatService.removeReaction(removeReactionDto, user.id);
    return { message: 'Reaction removed' };
  }

  @Get('messages/:messageId/reactions')
  async getMessageReactions(
    @Req() req: Request,
    @Param('messageId') messageId: string,
  ) {
    return this.chatService.getMessageReactions(messageId);
  }

  // Reply endpoints
  @Post('replies')
  async replyToMessage(
    @Req() req: Request,
    @Body() replyDto: ReplyToMessageDto,
  ) {
    const authId = req?.user?.sub;
    const { user } = await this.authService.fetchAuthUser(authId);

    const userProfileId = user.datingProfile?.id || user.friendProfile?.id;
    if (!userProfileId) {
      throw new Error('User profile not found');
    }

    // TODO: Get from user's subscription
    const isPremium = false;
    const isTrueFynd = false;

    return this.chatService.replyToMessage(
      replyDto,
      user.id,
      userProfileId,
      isPremium,
      isTrueFynd,
    );
  }

  @Get('messages/:messageId/replies')
  async getMessageReplies(
    @Req() req: Request,
    @Param('messageId') messageId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.chatService.getMessageReplies(messageId, page, limit);
  }

  // Media endpoints
  @Post('media/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(
    @Req() req: Request,
    @Body() uploadDto: UploadMediaDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const authId = req?.user?.sub;
    const { user } = await this.authService.fetchAuthUser(authId);

    const userProfileId = user.datingProfile?.id || user.friendProfile?.id;
    if (!userProfileId) {
      throw new Error('User profile not found');
    }

    if (!file) {
      throw new Error('No file provided');
    }

    // TODO: Get from user's subscription
    const isPremium = false;
    const isTrueFynd = false;

    return this.mediaService.uploadMedia(
      uploadDto,
      file,
      user.id,
      userProfileId,
      isPremium,
      isTrueFynd,
    );
  }

  @Get('media/:messageId')
  async getMediaMessage(
    @Req() req: Request,
    @Param('messageId') messageId: string,
  ) {
    const authId = req?.user?.sub;
    const { user } = await this.authService.fetchAuthUser(authId);

    return this.mediaService.getMediaMessage(messageId, user.id);
  }

  @Delete('media/:messageId')
  async deleteMediaMessage(
    @Req() req: Request,
    @Param('messageId') messageId: string,
  ) {
    const authId = req?.user?.sub;
    const { user } = await this.authService.fetchAuthUser(authId);

    await this.mediaService.deleteMediaMessage(messageId, user.id);
    return { message: 'Media message deleted' };
  }

  // ==================== CALL ENDPOINTS ====================

  @Post('calls/initiate')
  async initiateCall(
    @Req() req: Request,
    @Body() initiateCallDto: InitiateCallDto,
  ) {
    const authId = req?.user?.sub;
    const { user } = await this.authService.fetchAuthUser(authId);

    const userProfileId = user.datingProfile?.id || user.friendProfile?.id;
    if (!userProfileId) {
      throw new Error('User profile not found');
    }

    // TODO: Get from user's subscription
    const isPremium = false;
    const isTrueFynd = false;

    return this.chatService.initiateCall(
      initiateCallDto,
      authId, // Use authId instead of user.id for Agora UID
      userProfileId,
      isPremium,
      isTrueFynd,
    );
  }

  @Post('calls/answer')
  async answerCall(@Req() req: Request, @Body() answerCallDto: AnswerCallDto) {
    const authId = req?.user?.sub;
    const { user } = await this.authService.fetchAuthUser(authId);

    const userProfileId = user.datingProfile?.id || user.friendProfile?.id;
    if (!userProfileId) {
      throw new Error('User profile not found');
    }

    return this.chatService.answerCall(
      answerCallDto,
      authId,
      user.id,
      userProfileId,
    );
  }

  @Post('calls/end')
  async endCall(@Req() req: Request, @Body() endCallDto: EndCallDto) {
    const authId = req?.user?.sub;
    const { user } = await this.authService.fetchAuthUser(authId);

    await this.chatService.endCall(endCallDto, user.id);
    return { message: 'Call ended' };
  }

  @Get('calls/history')
  async getCallHistory(
    @Req() req: Request,
    @Query('profileType') profileType: ProfileType = ProfileType.DATE,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const authId = req?.user?.sub;
    const { user } = await this.authService.fetchAuthUser(authId);

    return this.chatService.getCallHistory(user.id, profileType, page, limit);
  }

  @Get('calls/active')
  async getActiveCall(@Req() req: Request) {
    const authId = req?.user?.sub;
    const { user } = await this.authService.fetchAuthUser(authId);

    return this.chatService.getActiveCall(user.id);
  }

  @Get('calls/provider-config')
  async getCallProviderConfig(@Req() req: Request) {
    return this.chatService.getCallProviderConfig();
  }

  @Get('calls/available-providers')
  async getAvailableCallProviders(@Req() req: Request) {
    return this.chatService.getAvailableCallProviders();
  }
}
