/* eslint-disable prettier/prettier */
import { Body, Controller, Delete, Get, HttpException, HttpStatus, InternalServerErrorException, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { ParticipantsService } from '../services/participants.service';
import { Participant } from '../dto/participantDto';
import { OtpService } from 'src/utils/otp.service';
import { emailOtpDto } from '../dto/emailOtpDto';

@Controller('participants')
export class ParticipantsController {
  constructor(private readonly service: ParticipantsService, 
    private readonly otpService:OtpService
  ) {}

  @Get()
  async getItems(@Res() res: Response){
    const items:Participant[] | null = await this.service.getAllParticipants();
    if(items && items.length>0){
        return res.status(HttpStatus.OK).json(items);
    }
    else if(items?.length===0){
        throw new HttpException('Item not found', HttpStatus.NOT_FOUND);
    }
    else throw InternalServerErrorException;

  }
  @Get('/verify')
  async sendEmail(@Body() body:emailOtpDto,@Res() res: Response){
     const verify = await this.service.verifyEmail("holy.s.hit9137@gmail.com",body.otp);
    if(verify){
        return res.status(HttpStatus.OK);
    }
    throw new InternalServerErrorException;
     
  }

  @Get(':id')
  async getItem(@Param('id') id:string, @Res() res: Response){
    const item:Participant | null = await this.service.getParticipant(id);
    if(item){
        return res.status(HttpStatus.OK).json(item);
    }
    else if(!item){
        throw new HttpException('Item not found', HttpStatus.NOT_FOUND);
    }
    else throw InternalServerErrorException;

  }
  @Post()
  async createItem(@Body() item:Participant, @Res() res: Response){
    const creaatedItem : Participant | null = await this.service.addParticipant(item);
    if(creaatedItem){
       return res.status(HttpStatus.CREATED).json(creaatedItem)
    }
    throw InternalServerErrorException;  
  }

  @Delete(':id')
  async deleteParticipant(@Param('id') id: string): Promise<{ deleted: boolean }> {
    const deleted = await this.service.deleteParticipant(id);
    return { deleted };
  }
}
