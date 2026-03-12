import { AsyncLocalStorage } from 'async_hooks';

export const requestContext = new AsyncLocalStorage<{ firmId?: string }>();

export const getFirmId = () => {
    return requestContext.getStore()?.firmId;
};
