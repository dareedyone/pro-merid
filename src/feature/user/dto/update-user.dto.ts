import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto1 extends PartialType(CreateUserDto) {}

// export class UpdateUserDto2 implements Partial<CreateUserDto> {
//   // Make all fields optional for update
//   // @IsOptional()
//   // @IsEmail()
//   // @MaxLength(255)
//   // email?: string;
//   // @IsOptional()
//   // @IsString()
//   // @MinLength(8)
//   // @MaxLength(255)
//   // password?: string;
//   // Include all other fields as optional...
// }
