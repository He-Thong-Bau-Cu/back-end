export enum STATUS {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DELETED = 'DELETED',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PROCESSING = 'PROCESSING',
  CANCELLED = 'CANCELLED',
  SUSPENDED = 'SUSPENDED',
  ARCHIVED = 'ARCHIVED',
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  EXPIRED = 'EXPIRED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ON_HOLD = 'ON_HOLD',
  NEW = 'NEW',
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  LOCKED = 'LOCKED',
  UNLOCKED = 'UNLOCKED',
  VERIFIED = 'VERIFIED',
  UNVERIFIED = 'UNVERIFIED',
  SUBMITTED = 'SUBMITTED',
  IN_REVIEW = 'IN_REVIEW',
  COMPLETED_SUCCESSFULLY = 'COMPLETED_SUCCESSFULLY',
  COMPLETED_WITH_ERRORS = 'COMPLETED_WITH_ERRORS',
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  FINALIZED = 'FINALIZED',
  CANCELING = 'CANCELING',
  RESOLVED = 'RESOLVED',
  UNRESOLVED = 'UNRESOLVED',
  ACTIVE_PENDING = 'ACTIVE_PENDING',
  INACTIVE_PENDING = 'INACTIVE_PENDING',
  DELETION_PENDING = 'DELETION_PENDING',
  ARCHIVAL_PENDING = 'ARCHIVAL_PENDING',
  RESTORATION_PENDING = 'RESTORATION_PENDING',
  UPDATE_PENDING = 'UPDATE_PENDING',
  SYNCING = 'SYNCING',
  SYNCED = 'SYNCED',
  UNSYNCED = 'UNSYNCED',
  BACKUP_IN_PROGRESS = 'BACKUP_IN_PROGRESS',
  BACKUP_COMPLETED = 'BACKUP_COMPLETED',
  BACKUP_FAILED = 'BACKUP_FAILED',
  MAINTENANCE = 'MAINTENANCE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
  IN_SERVICE = 'IN_SERVICE',
  TESTING = 'TESTING',
  PRODUCTION = 'PRODUCTION',
  STAGING = 'STAGING',
  VALID = 'VALID',
  INVALID = 'INVALID',
  // status sent email
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  OPENED = 'OPENED',
  INVITED = 'INVITED',
  CONFIRMED = 'CONFIRMED',  //voter click vào mail

  CAST = 'CAST', //ballots was casted

  // status of meeting
  SCHEDULED = 'SCHEDULED',
  ONGOING = 'ONGOING',
  POSTPONED = 'POSTPONED',

  //status data: Signed_blink, DATA_ENTERED, APPROVED_SIGNED
  //// WAIT_ENTER_DATA, WAIT_APROVAL,REQUEST_EDIT, APPROVED_SIGNED, DARF
  WAIT_ENTER_DATA = 'WAIT_ENTER_DATA',
  WAIT_APROVAL = 'WAIT_APROVAL',
  REQUEST_EDIT = 'REQUEST_EDIT',
  APPROVED_SIGNED = 'APPROVED_SIGNED',
  DARF = 'DARF',
  AUTHORIZED = 'AUTHORIZED',
}


export enum STATUS_SYSTEM {
  SUCCESS = 'SUCCESS',
  INFORMATION = 'INFORMATION',
  REDIRECTION = 'REDIRECTION',
  CLIENT_ERROR = 'CLIENT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
}

export enum MESSAGE_STATUS {
  SUCCESS = 'Thành công!',
  INFORMATION = 'Thống báo',
  REDIRECTION = 'Chuyển huận',
  CLIENT_ERROR = 'Loại lỗi client',
  SERVER_ERROR = 'Lỗi server',
  ROLE_SUCCESS = 'Vai trò được tạo thành công!',
  ROLE_UPDATE = 'Vai trò được cập nhật thành công!',
  ROLE_DELETE = 'Vai trò được xóa thành công!',
  ROLE_VIEW = 'Lấy dữ liệu vai trò thành công!',
  ROLE_STATS = 'Lấy dữ liệu thống kê vai trò thông!',
  PERMISSION_STATS = 'Lấy dữ liệu thống kê quyền!',
  ROLE_PERMISSIONS_VIEW = 'Lấy dữ liệu quyền cho vai trò thành công!',
  ROLE_PERMISSIONS_UPDATE = 'Cập nhật quyền cho vai trò thành công!',
  PERMISSION_SUCCESS = 'Quyền được tạo thành công!',
  PERMISSION_UPDATE = 'Quyền được cập nhật thành công!',
  PERMISSION_DELETE = 'Quyền được xóa thành công!',
  PERMISSION_VIEW = 'Lấy dữ liệu quyền thành công!',
  SYSTEM_LOGS_VIEW = 'Dữ liệu system log trả về thành công!',
  AUDIT_LOGS_VIEW = 'Dữ liệu audit log trả về thành công!',
  USER_CREATE = 'Tạo người dùng thành công!',
  USER_UPDATE = 'Cập nhật người dùng thành công!',
  USER_DELETE = 'Xóa người dùng thành công!',
  USER_VIEW = 'Lấy dữ liệu người dùng thành công!',
  USER_STATS = 'Lấy dữ liệu thống kê người dùng thành công!',
  USER_ROLE_UPDATE = 'Cập nhật vai trò cho người dùng thành công!',
  LOGIN_SUCCESS = 'Đăng nhập thành công!',
  TWO_FA_ENABLED = 'Xác thực hai yếu tố đã được kích hoạt!',
  TWO_FA_DISABLED = 'Xác thực hai yếu tố đã được vô hiệu hóa!',
  TWO_FA_UPDATE = 'Cập nhật xác thực hai yếu tố thành cong!',
  TWO_FA_VIEW = 'Lấy dữ liệu xác thực hai yếu tố thành cong!',
  TWO_FA_CREATE = 'Tạo xác thức hai yếu tố thành cong!',
  TWO_FA_DELETE = 'Xóa xác thức hai yếu tố	thanh cong!',

}

export enum DELEGATION_TYPE {
  ELECTION = 'election',
  LONG_TERM = 'long_term'
}

export enum SEVERITY {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}
