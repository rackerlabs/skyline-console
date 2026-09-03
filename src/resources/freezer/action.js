// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

export const freezerActionType = {
  backup: t('Backup'),
  restore: t('Restore'),
  admin: t('Admin'),
  info: t('Info'),
  exec: t('Exec'),
};

export const freezerStorageType = {
  local: t('Local'),
  swift: t('Swift'),
  ssh: t('SSH'),
  s3: t('S3'),
  ftp: t('FTP'),
  ftps: t('FTPS'),
};

export const freezerModeType = {
  fs: t('File System'),
  mysql: t('MySQL'),
  mongo: t('MongoDB'),
  sqlserver: t('SQL Server'),
  cinder: t('Cinder'),
  nova: t('Nova'),
};
