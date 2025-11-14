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

export function isValidPhone(phone: string): boolean {
  const regex = /^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-5]|9[0-9])\d{7}$/;
  return regex.test(phone);
}

export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function isValidateCitizenId(id: string): boolean {
  if (!id) throw new Error("Citizen ID không được để trống");

  const trimmed = id.trim();

  if (!/^[0-9]+$/.test(trimmed)) {
    throw new Error("Citizen ID chỉ được chứa số");
  }

  if (trimmed.length !== 9 && trimmed.length !== 12) {
    throw new Error("Citizen ID phải có 9 số (CMND) hoặc 12 số (CCCD)");
  }

  return true;
}
