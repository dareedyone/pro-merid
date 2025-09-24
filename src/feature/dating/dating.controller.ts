import { Controller, Post, Body, Patch, Req, Delete } from '@nestjs/common';
import { DatingService } from './dating.service';
import { InteractionService } from '../../common/services/interaction.service';
import { AuthService } from '../auth/auth.service';
import { SubscriptionService } from '../subscription/services/subscription.service';
import { Request } from 'express';
import {
  CreateDatingPersonalityDto,
  UpdateDatingPersonalityDto,
} from './dto/dating-personality.dto';
import {
  CreateDatingRelationshipDto,
  UpdateDatingRelationshipDto,
} from './dto/dating-relationship.dto';
// import {
//   RematchRequestDto,
//   RematchResponseDto,
// } from '../../common/dtos/interaction.dto';
import { CreateLocationProfileDto } from '../../common/dtos/base-location-profile.dto';
import {
  CreateLocationProfileMediaDto,
  UpdateMediaDto,
  RemoveMediaDto,
} from '../../common/dtos/location-media.dto';
import { ProfileType } from 'src/common/types/enums/other.enum';
import { BaseProfileController } from '../../common/controllers/base-profile.controller';

@Controller('dating')
export class DatingController extends BaseProfileController {
  constructor(
    private readonly datingService: DatingService,
    protected readonly interactionService: InteractionService,
    protected readonly authService: AuthService,
    protected readonly subscriptionService: SubscriptionService,
  ) {
    super(datingService, interactionService, authService, subscriptionService);
  }

  protected get profileType(): ProfileType {
    return ProfileType.DATE;
  }

  @Post('personality')
  createPersonality(
    @Req() req: Request,
    @Body() dto: CreateDatingPersonalityDto,
  ) {
    const authId = req?.user?.sub;
    return this.datingService.addPersonality(authId, dto);
  }

  @Patch('personality')
  updatePersonality(
    @Req() req: Request,
    @Body() dto: UpdateDatingPersonalityDto,
  ) {
    const authId = req?.user?.sub;
    return this.datingService.updatePersonality(authId, dto);
  }

  @Post('relationship')
  createRelationship(
    @Req() req: Request,
    @Body() dto: CreateDatingRelationshipDto,
  ) {
    const authId = req?.user?.sub;
    return this.datingService.addRelationship(authId, dto);
  }

  @Patch('relationship')
  updateRelationship(
    @Req() req: Request,
    @Body() dto: UpdateDatingRelationshipDto,
  ) {
    const authId = req?.user?.sub;
    return this.datingService.updateRelationship(authId, dto);
  }

  @Post('location-profile')
  createLocationProfile(
    @Req() req: Request,
    @Body() dto: CreateLocationProfileDto,
  ) {
    const authId = req?.user?.sub;
    return this.datingService.addLocationProfile(authId, dto);
  }

  @Post('location-profile/media')
  createLocationProfileMedia(
    @Req() req: Request,
    @Body() dto: CreateLocationProfileMediaDto,
  ) {
    const authId = req?.user?.sub;
    return this.datingService.addLocationProfileMedia(authId, dto);
  }

  @Patch('location-profile/media')
  updateLocationProfileMedia(@Req() req: Request, @Body() dto: UpdateMediaDto) {
    const authId = req?.user?.sub;
    return this.datingService.updateLocationProfileMedia(authId, dto);
  }

  @Delete('location-profile/media')
  removeLocationProfileMedia(@Req() req: Request, @Body() dto: RemoveMediaDto) {
    const authId = req?.user?.sub;
    return this.datingService.removeLocationProfileMedia(authId, dto);
  }

  // @Post('interactions/rematch/request')
  // async requestRematch(@Req() req: Request, @Body() _dto: RematchRequestDto) {
  //   const _authId = req?.user?.sub;
  //   // TODO: Implement rematch logic in InteractionService if needed
  //   throw new Error('Rematch not yet implemented in unified service');
  // }

  // @Post('interactions/rematch/respond')
  // async respondToRematch(
  //   @Req() req: Request,
  //   @Body() _dto: RematchResponseDto,
  // ) {
  //   const _authId = req?.user?.sub;
  //   // TODO: Implement rematch logic in InteractionService if needed
  //   throw new Error('Rematch not yet implemented in unified service');
  // }
}
