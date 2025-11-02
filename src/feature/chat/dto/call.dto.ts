import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { CallType, CallStatus } from '../entities/call.entity';

export class InitiateCallDto {
  @IsString()
  @IsUUID()
  chatId: string;

  @IsEnum(CallType)
  type: CallType;
}

export class AnswerCallDto {
  @IsString()
  @IsUUID()
  callId: string;

  @IsOptional()
  @IsBoolean()
  accept?: boolean = true;
}

export class EndCallDto {
  @IsString()
  @IsUUID()
  callId: string;

  @IsOptional()
  @IsString()
  reason?: string = 'hung_up';
}

export class CallResponseDto {
  id: string;
  chatId: string;
  callerId: string;
  callerProfileId: string;
  participantIds: string[];
  participantProfileIds: string[];
  type: CallType;
  status: CallStatus;
  startedAt?: Date;
  endedAt?: Date;
  duration: number;
  endReason?: string;
  provider: string;
  channelName: string;
  token: string;
  callerUid?: number;
  participantUids: Record<string, number>;
  isRecording: boolean;
  recordingUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CallHistoryDto {
  id: string;
  chatId: string;
  chatName: string;
  chatAvatar?: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  type: CallType;
  status: CallStatus;
  startedAt?: Date;
  endedAt?: Date;
  duration: number;
  endReason?: string;
  isRecording: boolean;
  recordingUrl?: string;
  createdAt: Date;
}

export class CallListResponseDto {
  calls: CallHistoryDto[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
