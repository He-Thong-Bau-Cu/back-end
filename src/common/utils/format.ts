import { BadRequestException } from '@nestjs/common';
import moment from 'moment-timezone';

export function formatDateVN(date: Date): string {
  return moment(date)
    .tz('Asia/Ho_Chi_Minh')
    .format('YYYY-MM-DDTHH:mm:ss.SSSZ');
}

export default function removeVietnameseTones(str: string) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

export function formatDateDMY(date: Date | string) {
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function validateStatusFormat(status: string) {
  if (!status) return;
  const isValid = /^[A-Z_]+$/.test(status);

  if (!isValid) {
    throw new BadRequestException(
      `Trạng thái "${status}" không hợp lệ. Chỉ được chứa chữ IN HOA, không dấu, và có thể có dấu gạch dưới (_)`
    );
  }
}


