export enum STATUS {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DELETED = 'deleted',
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PROCESSING = 'processing',
  CANCELLED = 'cancelled',
  SUSPENDED = 'suspended',
  ARCHIVED = 'archived',
  DRAFT = 'draft',
  PUBLISHED = 'published',
  EXPIRED = 'expired',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ON_HOLD = 'on_hold',
  NEW = 'new',
  CLOSED = 'closed',
  OPEN = 'open',
  LOCKED = 'locked',
  UNLOCKED = 'unlocked',
  VERIFIED = 'verified',
  UNVERIFIED = 'unverified',
  SUBMITTED = 'submitted',
  IN_REVIEW = 'in_review',
  COMPLETED_SUCCESSFULLY = 'completed_successfully',
  COMPLETED_WITH_ERRORS = 'completed_with_errors',
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  FINALIZED = 'finalized',
  CANCELING = 'canceling',
  RESOLVED = 'resolved',
  UNRESOLVED = 'unresolved',
  ACTIVE_PENDING = 'active_pending',
  INACTIVE_PENDING = 'inactive_pending',
  DELETION_PENDING = 'deletion_pending',
  ARCHIVAL_PENDING = 'archival_pending',
  RESTORATION_PENDING = 'restoration_pending',
  UPDATE_PENDING = 'update_pending',
  SYNCING = 'syncing',
  SYNCED = 'synced',
  UNSYNCED = 'unsynced',
  BACKUP_IN_PROGRESS = 'backup_in_progress',
  BACKUP_COMPLETED = 'backup_completed',
  BACKUP_FAILED = 'backup_failed',
  MAINTENANCE = 'maintenance',
  OUT_OF_SERVICE = 'out_of_service',
  IN_SERVICE = 'in_service',
  TESTING = 'testing',
  PRODUCTION = 'production',
  STAGING = 'staging',
  //status sent email
  SENT = 'sent',
  DELIVERED = 'delivered',
  OPENED = 'opened',

  //status of meeting
  SCHEDULED = 'scheduled',
  ONGOING = 'ongoing',
  POSTPONED = 'postponed',

}


export enum STATUS_SYSTEM {
    SUCCESS = 'success',
    INFORMATION = 'information',
    REDIRECTION = 'redirection',
    CLIENT_ERROR = 'client_error',
    SERVER_ERROR = 'server_error',
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
    ROLE_PERMISSIONS_UPDATE = 'Cập nhật quyền cho vai trò thành công!',
    PERMISSION_SUCCESS = 'Quyền được tạo thành công!',
    PERMISSION_UPDATE = 'Quyền được cập nhật thành công!',
    PERMISSION_DELETE = 'Quyền được xóa thành công!',
    PERMISSION_VIEW = 'Lấy dữ liệu quyền thành công!',
    SYSTEM_LOGS_VIEW = 'Dữ liệu system log trả về thành công!',
}

export enum DELEGATION_TYPE{
  ELECTION ='election',
  LONG_TERM = 'long_term'
}

export enum SEVERITY {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}
