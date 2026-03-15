import { AsyncLocalStorage } from 'async_hooks';

export const requestContext = new AsyncLocalStorage<{ firmId?: string; rootFolderId?: string }>();

export const getFirmId = () => {
    return requestContext.getStore()?.firmId;
};

export const getRootFolderId = () => {
    return requestContext.getStore()?.rootFolderId;
};
