import { Injectable } from '@nestjs/common';
import { CreateChatDto } from './dto/create-chat.dto';
// import { UpdateChatDto } from './dto/update-chat.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Chat } from './entities/chat.entity';
import { Model } from 'mongoose';

@Injectable()
export class ChatService {
  constructor(@InjectModel(Chat.name) private chatModel: Model<Chat>) {}

  async create(createChatDto: CreateChatDto): Promise<Chat> {
    const createdChat = new this.chatModel(createChatDto);
    return createdChat.save();
  }

  async findAll(): Promise<Chat[]> {
    return this.chatModel.find().exec();
  }

  findOne(id: number) {
    return `This action returns a #${id} chat`;
  }

  // update(id: number, _updateChatDto: UpdateChatDto) {
  //   return `This action updates a #${id} chat`;
  // }

  remove(id: number) {
    return `This action removes a #${id} chat`;
  }
}
