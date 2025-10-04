import { PartialType } from '@nestjs/mapped-types';
import { CreateSupportMessageDto } from './create-support-message.dto';

export class UpdateSupportDto extends PartialType(CreateSupportMessageDto) {}
