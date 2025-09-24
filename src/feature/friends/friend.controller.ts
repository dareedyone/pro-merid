import { Controller } from '@nestjs/common';
import { FriendsService } from './services/friends.service';
import { InteractionService } from '../../common/services/interaction.service';
import { ProfileType } from 'src/common/types/enums/other.enum';
import { AuthService } from '../auth/auth.service';
import { SubscriptionService } from '../subscription/services/subscription.service';
import { BaseProfileController } from '../../common/controllers/base-profile.controller';

@Controller('friends')
export class FriendController extends BaseProfileController {
  constructor(
    private readonly friendsService: FriendsService,
    protected readonly interactionService: InteractionService,
    protected readonly authService: AuthService,
    protected readonly subscriptionService: SubscriptionService,
  ) {
    super(friendsService, interactionService, authService, subscriptionService);
  }

  protected get profileType(): ProfileType {
    return ProfileType.FRIEND;
  }
}
