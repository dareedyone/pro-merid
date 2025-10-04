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
    const authUser = req?.user;
    return this.datingService.addPersonality(authUser, dto);
  }

  @Patch('personality')
  updatePersonality(
    @Req() req: Request,
    @Body() dto: UpdateDatingPersonalityDto,
  ) {
    const authUser = req?.user;
    return this.datingService.updatePersonality(authUser, dto);
  }

  @Post('relationship')
  createRelationship(
    @Req() req: Request,
    @Body() dto: CreateDatingRelationshipDto,
  ) {
    const authUser = req?.user;
    return this.datingService.addRelationship(authUser, dto);
  }

  @Patch('relationship')
  updateRelationship(
    @Req() req: Request,
    @Body() dto: UpdateDatingRelationshipDto,
  ) {
    const authUser = req?.user;
    return this.datingService.updateRelationship(authUser, dto);
  }

  @Post('location-profile')
  createLocationProfile(
    @Req() req: Request,
    @Body() dto: CreateLocationProfileDto,
  ) {
    const authUser = req?.user;
    return this.datingService.addLocationProfile(authUser, dto);
  }

  @Post('location-profile/media')
  createLocationProfileMedia(
    @Req() req: Request,
    @Body() dto: CreateLocationProfileMediaDto,
  ) {
    const authUser = req?.user;
    return this.datingService.addLocationProfileMedia(authUser, dto);
  }

  @Patch('location-profile/media')
  updateLocationProfileMedia(@Req() req: Request, @Body() dto: UpdateMediaDto) {
    const authUser = req?.user;
    return this.datingService.updateLocationProfileMedia(authUser, dto);
  }

  @Delete('location-profile/media')
  removeLocationProfileMedia(@Req() req: Request, @Body() dto: RemoveMediaDto) {
    const authUser = req?.user;
    return this.datingService.removeLocationProfileMedia(authUser, dto);
  }
}
