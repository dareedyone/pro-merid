import { PartialType } from '@nestjs/mapped-types';
import { CreateSupportDto } from './create-support-message.dto';

export class UpdateSupportDto extends PartialType(CreateSupportDto) {}
