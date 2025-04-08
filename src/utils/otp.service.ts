import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { Twilio as TwilioClient } from 'twilio';
import Redis from 'ioredis';
import { REDIS_CLIENT } from 'src/global/redis.module';

@Injectable()
export class OtpService {
  private twilioClient: TwilioClient;
  private emailTransporter: Transporter;

  constructor(
    private readonly configService: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
  ) {
    // Initialize Twilio client for sending SMS
    this.twilioClient = new TwilioClient(
      this.configService.get<string>('TWILIO_ACCOUNT_SID'),
      this.configService.get<string>('TWILIO_AUTH_TOKEN'),
    );

    // Initialize Nodemailer transporter for sending emails
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    this.emailTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465, // Use 465 for SSL
      secure: true, // true for 465, false for other ports (e.g. 587)
      auth: {
        user: 'minbay.arsen2002@gmail.com',
        pass: 'dnqobsoeaiiguxxg', // App Password if using 2FA
      },
    });
  }

  /**
   * Generates a random OTP code consisting of digits.
   * @param length Length of the OTP code (default is 6)
   * @returns The generated OTP code as a string
   */
  generateOtp(length = 6): string {
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += Math.floor(Math.random() * 10); // generates a random digit (0-9)
    }
    return otp;
  }

  /**
   * Sends the OTP code via SMS using Twilio.
   * @param phoneNumber The recipient's phone number
   * @param otp The OTP code to send
   */
  async sendOtpViaSms(phoneNumber: string, otp: string): Promise<void> {
    await this.twilioClient.messages.create({
      body: `Ваш OTP код: ${otp}`,
      from: this.configService.get<string>('TWILIO_PHONE_NUMBER'),
      to: phoneNumber,
    });
  }

  /**
   * Sends the OTP code via email using Nodemailer.
   * @param email The recipient's email address
   * @param otp The OTP code to send
   */
  async sendOtpViaEmail(
    email: string,
    subject: string,
    text: string,
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await this.emailTransporter.sendMail({
      from: this.configService.get<string>('SMTP_FROM'),
      to: email,
      subject: subject,
      text: text,
    });
  }

  /**
   * Saves the OTP code in Redis with a TTL (time-to-live) for expiration.
   * The OTP is stored using a key in the format 'otp:<identifier>'.
   * @param identifier A unique identifier for the OTP (e.g., email or phone number)
   * @param otp The OTP code to save
   */
  async saveOtp(identifier: string, otp: string): Promise<void> {
    // Save OTP with a TTL of 5 minutes (300 seconds)
    await this.redisClient.set(`otp:${identifier}`, otp, 'EX', 300);
  }

  /**
   * Verifies the provided OTP against the stored value in Redis.
   * If the OTP is valid, it removes the stored OTP.
   * @param identifier The unique identifier used when saving the OTP (e.g., email or phone number)
   * @param otp The OTP code provided by the user
   * @returns True if the OTP is correct; otherwise, false.
   */
  async verifyOtp(identifier: string, otp: string): Promise<boolean> {
    try {
      // Get the stored OTP from Redis
      const storedOtp = await this.redisClient.get(`otp:${identifier}`);

      if (!storedOtp) {
        // OTP not found in Redis
        return false;
      }

      if (storedOtp !== otp) {
        // Provided OTP does not match the stored one
        return false;
      }

      // Delete the OTP asynchronously (optional: avoid waiting for deletion)
      this.redisClient.del(`otp:${identifier}`).catch((err) => {
        console.error('Error deleting OTP from Redis:', err);
      });

      return true;
    } catch (error) {
      console.error('verifyOtp error:', error);
      return false;
    }
  }
}
