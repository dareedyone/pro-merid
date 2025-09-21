import {
  Controller,
  // Post,
  // Get,
  // Body,
  // HttpCode,
  // HttpStatus,
} from '@nestjs/common';
// import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FriendsService } from './services/friends.service';
import { InteractionService } from '../../common/services/interaction.service';
// import {
//   CreateInteractionDto,
//   InteractionResponseDto,
//   MatchResponseDto,
// } from '../../common/dtos/interaction.dto';
// import {
//   AcceptFriendRequestDto,
//   RejectFriendRequestDto,
//   FriendRequestResponseDto,
// } from './dtos/friend-interaction.dto';
import { ProfileType } from 'src/common/types/enums/other.enum';
import { AuthService } from '../auth/auth.service';
import { BaseProfileController } from '../../common/controllers/base-profile.controller';

@Controller('friends')
export class FriendController extends BaseProfileController {
  constructor(
    private readonly friendsService: FriendsService,
    protected readonly interactionService: InteractionService,
    protected readonly authService: AuthService,
  ) {
    super(friendsService, interactionService, authService);
  }

  protected get profileType(): ProfileType {
    return ProfileType.FRIEND;
  }

  // ==================== LEGACY ENDPOINTS (for backward compatibility) ====================

  // @Post('like')
  // @HttpCode(HttpStatus.CREATED)
  // async createFriendLike(
  //   @CurrentUser() user: { id: string },
  //   @Body() createDto: CreateInteractionDto,
  // ): Promise<InteractionResponseDto> {
  //   return this.interactionService.createInteraction(user.id, createDto);
  // }

  // @Post('accept')
  // @HttpCode(HttpStatus.OK)
  // async acceptFriendLike(
  //   @CurrentUser() _user: { id: string },
  //   @Body() _acceptDto: AcceptFriendRequestDto,
  // ): Promise<FriendRequestResponseDto> {
  //   // TODO: Implement accept logic in InteractionService if needed
  //   throw new Error('Accept not yet implemented in unified service');
  // }

  // @Post('reject')
  // @HttpCode(HttpStatus.OK)
  // async rejectFriendLike(
  //   @CurrentUser() _user: { id: string },
  //   @Body() _rejectDto: RejectFriendRequestDto,
  // ): Promise<{ message: string }> {
  //   // TODO: Implement reject logic in InteractionService if needed
  //   throw new Error('Reject not yet implemented in unified service');
  // }

  // @Get('likes')
  // async getFriendLikes(
  //   @CurrentUser() user: { id: string },
  // ): Promise<InteractionResponseDto[]> {
  //   return this.interactionService.getInteractionHistory(
  //     user.id,
  //     ProfileType.FRIEND,
  //   );
  // }

  // @Get('list')
  // async getFriends(
  //   @CurrentUser() user: { id: string },
  // ): Promise<MatchResponseDto[]> {
  //   return this.interactionService.getMatches(user.id, ProfileType.FRIEND);
  // }
}
