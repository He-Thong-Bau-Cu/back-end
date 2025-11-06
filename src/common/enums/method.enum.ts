export enum METHOD {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  DELETE = 'delete',
  PATCH = 'patch',
  SEARCH = 'search',
  CREATE = 'create',
  UPDATE = 'update',
  DETAIL = 'detail',
  SETUP = 'setup',
  VERIFIED = 'verify',
  REGISTER = 'register',
}

export enum ENDPOINT {
  LOGIN = 'login',
  TWOFA = '2fa',
  SYSTEM_LOG = 'system-logs',
  ROLE = 'roles',
  PERMISSION = 'permissions',
  ROLE_PERMISSION = 'role-permissions',
  USER = 'users',
}
