import type {
  CreateDatingProfileDto,
  UpdateDatingProfileDto,
} from '../../feature/dating/dto/dating-profile.dto';
import type {
  CreateFriendProfileDto,
  UpdateFriendProfileDto,
} from '../../feature/friends/dtos/friend-profile.dto';
import type {
  CreateDatingFilterDto,
  UpdateDateFilterDto,
} from '../../feature/dating/dto/dating-filter.dto';
import type {
  CreateFriendFilterDto,
  UpdateFriendFilterDto,
} from '../../feature/friends/dtos/friend-filter.dto';

export type CreateProfileDto = CreateDatingProfileDto | CreateFriendProfileDto;
export type UpdateProfileDto = UpdateDatingProfileDto | UpdateFriendProfileDto;
export type CreateFilterDto = CreateDatingFilterDto | CreateFriendFilterDto;
export type UpdateFilterDto = UpdateDateFilterDto | UpdateFriendFilterDto;
