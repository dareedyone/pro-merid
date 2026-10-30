import { Injectable } from '@nestjs/common';
import { CreateSupportMessageDto } from './dto/create-support-message.dto';
import { UpdateSupportDto } from './dto/update-support.dto';

@Injectable()
export class SupportService {
  create(createSupportDto: CreateSupportMessageDto) {
    return 'This action adds a new support';
  }

  findAll() {
    return `This action returns all support`;
  }

  findOne(id: number) {
    return `This action returns a #${id} support`;
  }

  update(id: number, updateSupportDto: UpdateSupportDto) {
    return `This action updates a #${id} support`;
  }

  remove(id: number) {
    return `This action removes a #${id} support`;
  }
}
