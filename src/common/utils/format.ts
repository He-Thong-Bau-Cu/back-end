import moment from 'moment-timezone';

export function formatDateVN(date: Date): string {
  return moment(date)
    .tz('Asia/Ho_Chi_Minh')
    .format('YYYY-MM-DDTHH:mm:ss.SSSZ');
}

