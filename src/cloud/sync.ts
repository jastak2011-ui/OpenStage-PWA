import { currentCloudUserId } from './auth';

export type CloudSyncContext = {
  userId: string;
};

export function getCloudSyncContext(): CloudSyncContext {
  return {
    userId: currentCloudUserId()
  };
}
