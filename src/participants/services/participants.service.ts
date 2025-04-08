import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from 'src/global/redis.module';
import { Participant } from 'src/participants/dto/participantDto';
import { OtpService } from 'src/utils/otp.service';

@Injectable()
export class ParticipantsService {
  private tableKey = 'participants:table';

  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
    private readonly otpService: OtpService,
  ) {}

  /**
   * Имитирует создание таблицы в Redis с использованием хеша.
   * Здесь мы создаём ключ, который будет хранить данные участников.
   */
  async createTable(): Promise<string> {
    // Очищаем предыдущие данные, если они существуют.
    await this.redisClient.del(this.tableKey);
    // Можно установить какие-то начальные значения или заголовки, если нужно.
    // Например: await this.redis.hset(tableKey, 'header', 'participantData');
    return this.tableKey;
  }

  /**
   * Добавление записи участника в "таблицу"
   * @param id Идентификатор участника (ключ в хеше)
   * @param data Данные участника, которые будут сохранены (преобразуем объект в JSON)
   */
  async addParticipant(data: Participant): Promise<Participant> {
    const id = await this.redisClient.incr('participants:nextId');
    data.createdAt = new Date();
    const otp = this.otpService.generateOtp();
    await this.redisClient.hset(this.tableKey, id, JSON.stringify(data));
    await this.otpService.sendOtpViaEmail(data.email, otp);
    await this.otpService.saveOtp(data.email, otp);
    return data;
  }

  /**
   * Получение данных участника по его ID
   * @param id Идентификатор участника
   */
  async getParticipant(id: string): Promise<Participant | null> {
    const data = await this.redisClient.hget(this.tableKey, id);
    return data ? (JSON.parse(data) as Participant) : null;
  }

  /**
   * Получение всех записей из "таблицы"
   */
  async getAllParticipants(): Promise<Participant[] | null> {
    const data = await this.redisClient.hgetall(this.tableKey);
    const participants: Participant[] = [];
    for (const key in data) {
      const participant = JSON.parse(data[key]) as Participant;
      // Inject the id from the key into the participant object
      participants.push({ ...participant, id: Number(key) });
    }
    return participants;
  }

  async deleteParticipant(id: string): Promise<boolean> {
    // HDEL returns the number of fields that were removed.
    const result = await this.redisClient.hdel(this.tableKey, id);
    console.log('Deleting participant with id:', id);

    // If result > 0, then the participant was deleted successfully.
    return result > 0;
  }

  async verifyEmail(email: string, otp: string): Promise<boolean> {
    try {
      await this.verifyEmail(email, otp);
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }
}
