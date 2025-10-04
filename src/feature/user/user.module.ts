import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Auth } from '../auth/entities/auth.entity';
import { User } from './entities/user/user.entity';
import { Anchor } from '../anchor/entities/anchor.entity';
import { Interest } from './entities/user/character/interest.entity';
import { Country } from '../location/entities/country.entity';
import { Profession } from './entities/user/character/profession.entity';
import { Religion } from './entities/user/character/religion.entity';
import { Ethnic } from '../location/entities/ethnic.entity';
import { DatingProfile } from '../dating/entities/dating.profile';
import { DatingLocationProfile } from '../dating/entities/dating-location.profile';
import { DatingPersonality } from '../dating/entities/dating.personality.entity';
import { DatingRelationship } from '../dating/entities/dating-relationship.entity';
import { DatingBiol } from '../dating/entities/dating-biol.entity';
import { Media } from './entities/media.entity';
import { City } from '../location/entities/city.entity';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      Auth,
      User,
      Anchor,
      Interest,
      Country,
      Profession,
      Religion,
      Ethnic,
      DatingProfile,
      DatingLocationProfile,
      DatingPersonality,
      DatingRelationship,
      DatingBiol,
      Media,
      City,
    ]),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
