export type CloudSyncContext = {
  userId: string;
};

export function getCloudSyncContext(userId: string): CloudSyncContext {
  return {
    userId
  };
}
