import { Controller, Post, Body, UseGuards, Req, Patch } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/guards/roles.decorator';
import { UserType } from 'src/common/types/enums/user.enum';
import { Request } from 'express';

// req.user; // Your JWT payload
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserType.USER)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Req() req: Request, @Body() createUserDto: CreateUserDto) {
    const authId = req?.user?.sub;
    return this.userService.create(authId, createUserDto);
  }

  @Patch()
  update(@Req() req: Request, @Body() updateUserDto: UpdateUserDto) {
    const authId = req?.user?.sub;
    return this.userService.update(authId, updateUserDto);
  }

  // @Post('base/bio')
  // addUserBio(
  //   @Req() req: Request,
  //   @Body() createUserBiolDto: CreateUserBiolDto,
  // ) {
  //   const authId = req?.user?.sub;
  //   return this.userService.addUserBiol(authId, createUserBiolDto);
  // }

  // @Patch('base/bio')
  // updateUserBio(
  //   @Req() req: Request,
  //   @Body() updateUserBiolDto: UpdateUserBiolDto,
  // ) {
  //   const authId = req?.user?.sub;
  //   return this.userService.updateUserBiol(authId, updateUserBiolDto);
  // }

  // @Post('sort-pictures')
  // @UseInterceptors(
  //   FilesInterceptor('profilePictures', 5),
  //   FileInterceptor('selfie'),
  // )
  // sortUserPictures(
  //   @Req() req: Request,
  //   @UploadedFiles(new FileValidationPipe())
  //   profilePictures: SortPictureUploadType['profilePictures'],
  //   @UploadedFile(new FileValidationPipe())
  //   selfie: SortPictureUploadType['selfie'],
  // ) {
  //   const authId = req?.user?.sub;
  //   return this.userService.sortUserPictures(authId, {
  //     profilePictures,
  //     selfie,
  //   });
  // }

  //djsdja

  // @Post('date')
  // @UseInterceptors(
  //   FilesInterceptor('profilePictures', 5),
  //   FileInterceptor('selfie'),
  // )
  // dateOnboard(
  //   @Req() req: Request,
  //   @Body() createDateProfileDto: CreateDateProfileDto,
  //   // @UploadedFiles(
  //   //   new FileValidationPipe({
  //   //     allowedMimeTypes: ['image/jpeg', 'image/png'],
  //   //     maxSizeInBytes: 5 * 1024 * 1024, // 5MB
  //   //   }),
  //   // )
  //   // profilePictures: Express.Multer.File[],
  //   // @UploadedFile(new FileValidationPipe())
  //   // selfie: Express.Multer.File,
  // ) {
  //   const authId = req?.user?.sub;
  //   return this.userService.dateSignUp(authId, createDateProfileDto);
  // }

  // @Patch('date')
  // dateUpdate(
  //   @Req() req: Request,
  //   @Body() updateDateProfileDto: UpdateDateProfileDto,
  // ) {
  //   const authId = req?.user?.sub;
  //   return this.userService.dateProfileUpdate(authId, updateDateProfileDto);
  // }

  // @Post('date/peronality')
  // datePersonality(
  //   @Req() req: Request,
  //   @Body() createPersonalityDto: CreatePersonalityDto,
  // ) {
  //   const authId = req?.user?.sub;
  //   return this.userService.addDatePersonality(authId, createPersonalityDto);
  // }

  // @Patch('date/peronality')
  // datePersonalityUpdate(
  //   @Req() req: Request,
  //   @Body() updatePersonalityDto: UpdatePersonalityDto,
  // ) {
  //   const authId = req?.user?.sub;
  //   return this.userService.updateDatePersonality(authId, updatePersonalityDto);
  // }

  // @Post('date/relationship')
  // dateRelationship(
  //   @Req() req: Request,
  //   @Body() createPersonalityDto: CreatePersonalityDto,
  // ) {
  //   const authId = req?.user?.sub;
  //   return this.userService.addDatePersonality(authId, createPersonalityDto);
  // }

  // @Patch('date/relationship')
  // dateRelationshipUpdate(
  //   @Req() req: Request,
  //   @Body() updatePersonalityDto: UpdatePersonalityDto,
  // ) {
  //   const authId = req?.user?.sub;
  //   return this.userService.updateDatePersonality(authId, updatePersonalityDto);
  // }

  // @Post('date/onboard/profile')
  // @UseInterceptors(
  //   FilesInterceptor('profilePictures', 5),
  //   FileInterceptor('selfie'),
  // )
  // dateOnboardProfile(
  //   @Req() req: Request,
  //   @Body() createUserDto: CreateUserDto,
  //   @UploadedFiles(
  //     new FileValidationPipe({
  //       allowedMimeTypes: ['image/jpeg', 'image/png'],
  //       maxSizeInBytes: 5 * 1024 * 1024, // 5MB
  //       isOptional: true,
  //     }),
  //   )
  //   profilePictures: Express.Multer.File[],
  //   @UploadedFile(new FileValidationPipe({ isOptional: true }))
  //   selfie: Express.Multer.File,
  // ) {
  //   const authId = req?.user?.sub;
  //   return this.userService.onboard(authId, createUserDto);
  // }
}
