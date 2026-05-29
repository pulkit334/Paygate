// Original file: proto/merchant.proto

import type { UserData as _authpackage_UserData, UserData__Output as _authpackage_UserData__Output } from '../authpackage/UserData';

export interface AuthRegisterRes {
  'success'?: (boolean);
  'data'?: (_authpackage_UserData | null);
}

export interface AuthRegisterRes__Output {
  'success'?: (boolean);
  'data'?: (_authpackage_UserData__Output);
}
