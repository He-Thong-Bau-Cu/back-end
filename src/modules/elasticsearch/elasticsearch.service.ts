import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class ElasticsearchService {
  private readonly client: AxiosInstance;
  private readonly logger = new Logger(ElasticsearchService.name);

  constructor() {
    const baseURL = process.env.ELASTICSEARCH_NODE;
    if (!baseURL) {
      this.logger.warn('ELASTICSEARCH_NODE is not set. Elasticsearch features disabled.');
    }
    const username = process.env.ELASTICSEARCH_USERNAME;
    const password = process.env.ELASTICSEARCH_PASSWORD;

    this.client = axios.create({
      baseURL,
      timeout: Number(process.env.ELASTICSEARCH_TIMEOUT ?? 5000),
      ...(username && password
        ? {
            auth: {
              username,
              password,
            },
          }
        : {}),
    });
  }

  async ensureIndex(index: string, body: Record<string, any>) {
    if (!this.client.defaults.baseURL) return;
    try {
      await this.client.head(`/${index}`);
    } catch (error) {
      if (error.response?.status === 404) {
        await this.client.put(`/${index}`, body);
        return;
      }
      throw error;
    }
  }

  async indexDocument(index: string, id: string, document: Record<string, any>) {
    if (!this.client.defaults.baseURL) return;
    await this.client.put(`/${index}/_doc/${id}`, document, {
      params: { refresh: 'wait_for' },
    });
  }

  async deleteDocument(index: string, id: string) {
    if (!this.client.defaults.baseURL) return;
    try {
      await this.client.delete(`/${index}/_doc/${id}`, {
        params: { refresh: 'wait_for' },
      });
    } catch (error) {
      if (error.response?.status !== 404) {
        throw error;
      }
    }
  }

  async search(index: string, body: Record<string, any>, from = 0, size = 10) {
    if (!this.client.defaults.baseURL) return null;
    const response = await this.client.post(`/${index}/_search`, {
      ...body,
      from,
      size,
    });
    return response.data;
  }

  async count(index: string): Promise<number> {
    if (!this.client.defaults.baseURL) return 0;
    try {
      const response = await this.client.get(`/${index}/_count`);
      return response.data?.count ?? 0;
    } catch (error) {
      if (error.response?.status === 404) {
        return 0;
      }
      throw error;
    }
  }

  async bulk(
    index: string,
    documents: Array<{ id: string; document: Record<string, any> }>,
  ) {
    if (!this.client.defaults.baseURL || !documents.length) return;
    const payload =
      documents
        .map(
          (doc) =>
            `${JSON.stringify({ index: { _index: index, _id: doc.id } })}\n${JSON.stringify(doc.document)}`,
        )
        .join('\n') + '\n';
    await this.client.post('/_bulk', payload, {
      headers: { 'Content-Type': 'application/x-ndjson' },
      params: { refresh: 'wait_for' },
    });
  }
}

