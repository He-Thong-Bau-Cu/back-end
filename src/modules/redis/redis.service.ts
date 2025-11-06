import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor() {
    const redisConfig: any = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      connectTimeout: 10000,
      lazyConnect: false,
    };

    // Nếu có username thì thêm vào (Redis Cloud thường yêu cầu)
    if (process.env.REDIS_USERNAME) {
      redisConfig.username = process.env.REDIS_USERNAME;
    }

    // Nếu có password thì thêm vào
    if (process.env.REDIS_PASSWORD) {
      redisConfig.password = process.env.REDIS_PASSWORD;
    }

    // Nếu có TLS/SSL (chỉ bật khi REDIS_TLS=true, không tự động bật)
    // Redis Cloud có thể không yêu cầu TLS tùy vào cấu hình
    if (process.env.REDIS_TLS === 'true') {
      redisConfig.tls = {
        rejectUnauthorized: false, // Cho phép self-signed certificates
      };
    }

    // Nếu có database number
    if (process.env.REDIS_DB) {
      redisConfig.db = parseInt(process.env.REDIS_DB);
    }

    this.client = new Redis(redisConfig);
  }

  async onModuleInit() {
    this.client.on('connect', () => {
      console.log('Redis connected successfully');
    });

    this.client.on('error', (err) => {
      console.error('Redis connection error:', err);
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async ttl(key: string): Promise<number> {
    return await this.client.ttl(key);
  }
}

